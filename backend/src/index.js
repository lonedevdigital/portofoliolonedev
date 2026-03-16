import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import {
  enforceReadableStyleColors,
  JsonStore,
  getDefaultStyleColors,
  getNowIso,
  getPaletteByKey,
  paletteLibrary,
  sanitizePublicUrl,
  sanitizeRichContent,
  slugify
} from './db.js';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_FILE =
  process.env.DATA_FILE ||
  process.env.DATABASE_FILE ||
  resolve(process.cwd(), 'data/app.db');
const LEGACY_DATA_FILE = process.env.LEGACY_DATA_FILE;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const CORS_CREDENTIALS =
  String(process.env.CORS_CREDENTIALS ?? 'true').toLowerCase() === 'true';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'lonedev_admin_session';
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true';

const app = Fastify({ logger: true });
const store = new JsonStore(DATA_FILE, { legacyJsonPath: LEGACY_DATA_FILE });

const corsOrigin =
  CORS_ORIGIN === '*'
    ? true
    : CORS_ORIGIN.split(',').map((item) => item.trim());

await app.register(cors, {
  origin: corsOrigin,
  credentials: CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});
await app.register(cookie);

function issueId(db, scope) {
  const current = Number(db.meta.nextIds?.[scope] ?? 1);
  db.meta.nextIds[scope] = current + 1;
  return current;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }

  return Boolean(value);
}

function byNewest(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function uniqueSlug(baseValue, collection, currentId = null) {
  const baseSlug = slugify(baseValue) || `item-${Date.now()}`;
  let candidate = baseSlug;
  let counter = 1;

  while (
    collection.some(
      (item) => item.slug === candidate && Number(item.id) !== Number(currentId)
    )
  ) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function withCategory(post, db) {
  const category = db.blogCategories.find(
    (item) => Number(item.id) === Number(post.categoryId)
  );

  return {
    ...post,
    categoryName: category?.name || null,
    categorySlug: category?.slug || null
  };
}

function sanitizeStyleColors(colors = {}) {
  const defaults = getDefaultStyleColors();
  const next = { ...defaults };

  Object.entries(colors || {}).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      next[key] = value.trim();
    }
  });

  return enforceReadableStyleColors(next);
}

function getSessionMaxAgeSeconds() {
  return Math.max(1, Math.floor(SESSION_TTL_DAYS * 24 * 60 * 60));
}

function getSessionExpiryIso() {
  return new Date(Date.now() + getSessionMaxAgeSeconds() * 1000).toISOString();
}

function createPasswordHash(password, providedSalt = null) {
  const salt = providedSalt || randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) {
    return false;
  }

  const hashedInput = scryptSync(password, salt, 64).toString('hex');
  const left = Buffer.from(hashedInput, 'hex');
  const right = Buffer.from(hash, 'hex');

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function createSessionToken() {
  return randomBytes(32).toString('hex');
}

function sanitizeAdmin(admin) {
  if (!admin) {
    return null;
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    createdAt: admin.createdAt
  };
}

function withActiveSessions(db) {
  const now = Date.now();
  const sessions = Array.isArray(db.auth?.sessions) ? db.auth.sessions : [];
  const activeSessions = sessions.filter((session) => {
    return new Date(session.expiresAt).getTime() > now;
  });

  const hasExpiredSessions = activeSessions.length !== sessions.length;
  return { activeSessions, hasExpiredSessions };
}

function readAuthState() {
  const db = store.read();
  const { activeSessions, hasExpiredSessions } = withActiveSessions(db);

  if (hasExpiredSessions) {
    db.auth.sessions = activeSessions;
    store.write(db);
  }

  return {
    admin: db.auth?.admin || null,
    sessions: hasExpiredSessions ? activeSessions : db.auth.sessions || []
  };
}

function getAdminBySessionToken(token) {
  if (!token) {
    return null;
  }

  const authState = readAuthState();
  const matched = authState.sessions.find((session) => session.token === token);

  if (!matched || !authState.admin) {
    return null;
  }

  if (Number(authState.admin.id) !== Number(matched.adminId)) {
    return null;
  }

  return sanitizeAdmin(authState.admin);
}

const adminProtectedPrefixes = [
  '/api/admin',
  '/api/products',
  '/api/blog/categories',
  '/api/blog/posts',
  '/api/clients',
  '/api/site/hero',
  '/api/site/navigation',
  '/api/site/footer',
  '/api/site/style'
];

function requiresAdminAuth(routePath = '') {
  return adminProtectedPrefixes.some((prefix) => {
    return routePath === prefix || routePath.startsWith(`${prefix}/`);
  });
}

function setSessionCookie(reply, token) {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    maxAge: getSessionMaxAgeSeconds()
  });
}

function clearSessionCookie(reply) {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE
  });
}

function getDashboardStats(db) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const visitsByDay = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const count = db.visits.filter((item) => item.visitedAt.slice(0, 10) === key).length;
    visitsByDay.push({ date: key, visits: count });
  }

  return {
    totalVisits: db.visits.length,
    visitsToday: db.visits.filter((item) => item.visitedAt.slice(0, 10) === todayKey).length,
    totalProducts: db.products.length,
    totalPosts: db.blogPosts.length,
    totalPublishedPosts: db.blogPosts.filter((item) => item.isPublished).length,
    totalCategories: db.blogCategories.length,
    totalClients: db.clients.length,
    visitsByDay
  };
}

app.addHook('preHandler', async (request, reply) => {
  const routePath = request.routeOptions?.url || '';

  if (!requiresAdminAuth(routePath)) {
    return;
  }

  const token = request.cookies?.[SESSION_COOKIE_NAME];
  const admin = getAdminBySessionToken(token);

  if (!admin) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
});

app.get('/health', async () => ({ status: 'ok', timestamp: getNowIso() }));

app.get('/api/auth/setup-status', async () => {
  const authState = readAuthState();
  return {
    needsSetup: !authState.admin,
    hasAdmin: Boolean(authState.admin)
  };
});

app.post('/api/auth/setup', async (request, reply) => {
  const body = request.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || password.length < 6) {
    return reply.code(400).send({
      message: 'Name, email, and password (min 6 chars) are required'
    });
  }

  let createdAdmin = null;
  let sessionToken = null;
  let alreadyInitialized = false;

  store.mutate((db) => {
    const currentAdmin = db.auth?.admin || null;
    if (currentAdmin) {
      alreadyInitialized = true;
      return db;
    }

    const now = getNowIso();
    const passwordHash = createPasswordHash(password);
    const admin = {
      id: 1,
      name,
      email,
      passwordHash: passwordHash.hash,
      passwordSalt: passwordHash.salt,
      createdAt: now
    };

    sessionToken = createSessionToken();
    db.auth.admin = admin;
    db.auth.sessions = [
      {
        token: sessionToken,
        adminId: admin.id,
        createdAt: now,
        expiresAt: getSessionExpiryIso()
      }
    ];
    createdAdmin = sanitizeAdmin(admin);
    return db;
  });

  if (alreadyInitialized) {
    return reply.code(409).send({
      message: 'Administrator already created. Please login.'
    });
  }

  setSessionCookie(reply, sessionToken);
  return reply.code(201).send({ admin: createdAdmin });
});

app.post('/api/auth/login', async (request, reply) => {
  const body = request.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const authState = readAuthState();
  const admin = authState.admin;

  if (!admin) {
    return reply.code(400).send({
      message: 'Administrator is not setup yet. Create account first.'
    });
  }

  if (!email || !password) {
    return reply.code(400).send({ message: 'Email and password are required' });
  }

  const isValidEmail = email === String(admin.email || '').toLowerCase();
  const isValidPassword = verifyPassword(
    password,
    admin.passwordHash,
    admin.passwordSalt
  );

  if (!isValidEmail || !isValidPassword) {
    return reply.code(401).send({ message: 'Invalid email or password' });
  }

  const token = createSessionToken();
  const now = getNowIso();

  store.mutate((db) => {
    const { activeSessions } = withActiveSessions(db);
    db.auth.sessions = [
      ...activeSessions.slice(-19),
      {
        token,
        adminId: admin.id,
        createdAt: now,
        expiresAt: getSessionExpiryIso()
      }
    ];
    return db;
  });

  setSessionCookie(reply, token);
  return { admin: sanitizeAdmin(admin) };
});

app.post('/api/auth/logout', async (request, reply) => {
  const token = request.cookies?.[SESSION_COOKIE_NAME];

  if (token) {
    store.mutate((db) => {
      db.auth.sessions = (db.auth.sessions || []).filter(
        (session) => session.token !== token
      );
      return db;
    });
  }

  clearSessionCookie(reply);
  return { success: true };
});

app.get('/api/auth/me', async (request) => {
  const token = request.cookies?.[SESSION_COOKIE_NAME];
  const admin = getAdminBySessionToken(token);

  return {
    authenticated: Boolean(admin),
    admin
  };
});

app.get('/api/site/palettes', async () => ({ palettes: paletteLibrary }));

app.post('/api/visits', async (request, reply) => {
  const body = request.body || {};
  const path = typeof body.path === 'string' && body.path.trim() ? body.path.trim() : '/';

  const record = store.mutate((db) => {
    const visit = {
      id: issueId(db, 'visits'),
      path,
      visitedAt: getNowIso()
    };
    db.visits.push(visit);
    return db;
  });

  const latest = record.visits[record.visits.length - 1];
  return reply.code(201).send({ visit: latest });
});

app.get('/api/admin/dashboard', async () => {
  const db = store.read();
  return { stats: getDashboardStats(db) };
});

app.get('/api/public/home', async () => {
  const db = store.read();
  const featuredProducts = db.products.filter((item) => item.isFeatured);
  const latestPosts = db.blogPosts
    .filter((item) => item.isPublished)
    .sort(byNewest)
    .slice(0, 6)
    .map((item) => withCategory(item, db));

  return {
    hero: db.site.hero,
    navigation: db.site.navigation,
    footer: db.site.footer,
    style: db.site.style,
    products: (featuredProducts.length ? featuredProducts : db.products).slice(0, 6),
    latestPosts,
    clients: db.clients
  };
});

app.get('/api/site/hero', async () => {
  const db = store.read();
  return { hero: db.site.hero };
});

app.put('/api/site/hero', async (request) => {
  const body = request.body || {};

  const updated = store.mutate((db) => {
    const current = db.site?.hero || {};

    db.site.hero = {
      badgeText:
        body.badgeText !== undefined
          ? String(body.badgeText || '').trim()
          : String(current.badgeText || '').trim(),
      title:
        body.title !== undefined
          ? String(body.title || '').trim()
          : String(current.title || '').trim(),
      description:
        body.description !== undefined
          ? String(body.description || '').trim()
          : String(current.description || '').trim(),
      primaryButtonLabel:
        body.primaryButtonLabel !== undefined
          ? String(body.primaryButtonLabel || '').trim()
          : String(current.primaryButtonLabel || '').trim(),
      primaryButtonHref:
        body.primaryButtonHref !== undefined
          ? String(body.primaryButtonHref || '').trim()
          : String(current.primaryButtonHref || '').trim(),
      secondaryButtonLabel:
        body.secondaryButtonLabel !== undefined
          ? String(body.secondaryButtonLabel || '').trim()
          : String(current.secondaryButtonLabel || '').trim(),
      secondaryButtonHref:
        body.secondaryButtonHref !== undefined
          ? String(body.secondaryButtonHref || '').trim()
          : String(current.secondaryButtonHref || '').trim(),
      adminButtonLabel:
        body.adminButtonLabel !== undefined
          ? String(body.adminButtonLabel || '').trim()
          : String(current.adminButtonLabel || '').trim(),
      adminButtonHref:
        body.adminButtonHref !== undefined
          ? String(body.adminButtonHref || '').trim()
          : String(current.adminButtonHref || '').trim()
    };

    return db;
  });

  return { hero: updated.site.hero };
});

app.get('/api/public/products', async () => {
  const db = store.read();
  return {
    products: db.products.sort(byNewest)
  };
});

app.get('/api/public/blog', async () => {
  const db = store.read();
  return {
    categories: db.blogCategories,
    posts: db.blogPosts
      .filter((item) => item.isPublished)
      .sort(byNewest)
      .map((item) => withCategory(item, db))
  };
});

app.get('/api/public/blog/:slug', async (request, reply) => {
  const db = store.read();
  const post = db.blogPosts.find(
    (item) => item.slug === request.params.slug && item.isPublished
  );

  if (!post) {
    return reply.code(404).send({ message: 'Post not found' });
  }

  return {
    post: withCategory(post, db)
  };
});

app.get('/api/products', async () => {
  const db = store.read();
  return { products: db.products.sort(byNewest) };
});

app.post('/api/products', async (request, reply) => {
  const body = request.body || {};

  if (!body.name || !String(body.name).trim()) {
    return reply.code(400).send({ message: 'Name is required' });
  }

  const now = getNowIso();
  const created = store.mutate((db) => {
    const product = {
      id: issueId(db, 'products'),
      name: String(body.name).trim(),
      slug: uniqueSlug(body.slug || body.name, db.products),
      shortDescription: String(body.shortDescription || '').trim(),
      detail: sanitizeRichContent(body.detail || ''),
      price: toNumber(body.price),
      currency: String(body.currency || 'USD').trim() || 'USD',
      category: String(body.category || 'General').trim() || 'General',
      imageUrl: sanitizePublicUrl(body.imageUrl || ''),
      isFeatured: toBoolean(body.isFeatured),
      createdAt: now,
      updatedAt: now
    };

    db.products.push(product);
    return db;
  });

  const product = created.products[created.products.length - 1];
  return reply.code(201).send({ product });
});

app.put('/api/products/:id', async (request, reply) => {
  const id = Number(request.params.id);
  const body = request.body || {};
  let updatedProduct = null;

  const updatedDb = store.mutate((db) => {
    const index = db.products.findIndex((item) => Number(item.id) === id);
    if (index < 0) {
      return db;
    }

    const current = db.products[index];
    const name = body.name !== undefined ? String(body.name).trim() : current.name;

    updatedProduct = {
      ...current,
      name,
      slug:
        body.slug !== undefined || body.name !== undefined
          ? uniqueSlug(body.slug || name, db.products, id)
          : current.slug,
      shortDescription:
        body.shortDescription !== undefined
          ? String(body.shortDescription || '').trim()
          : current.shortDescription,
      detail:
        body.detail !== undefined ? sanitizeRichContent(body.detail || '') : current.detail,
      price: body.price !== undefined ? toNumber(body.price, current.price) : current.price,
      currency:
        body.currency !== undefined
          ? String(body.currency || current.currency).trim() || current.currency
          : current.currency,
      category:
        body.category !== undefined
          ? String(body.category || current.category).trim() || current.category
          : current.category,
      imageUrl:
        body.imageUrl !== undefined
          ? sanitizePublicUrl(body.imageUrl || '')
          : current.imageUrl || '',
      isFeatured:
        body.isFeatured !== undefined ? toBoolean(body.isFeatured) : current.isFeatured,
      updatedAt: getNowIso()
    };

    db.products[index] = updatedProduct;
    return db;
  });

  const exists = updatedDb.products.some((item) => Number(item.id) === id);
  if (!exists || !updatedProduct) {
    return reply.code(404).send({ message: 'Product not found' });
  }

  return { product: updatedProduct };
});

app.delete('/api/products/:id', async (request, reply) => {
  const id = Number(request.params.id);
  let removed = false;

  store.mutate((db) => {
    const next = db.products.filter((item) => Number(item.id) !== id);
    removed = next.length !== db.products.length;
    db.products = next;
    return db;
  });

  if (!removed) {
    return reply.code(404).send({ message: 'Product not found' });
  }

  return { success: true };
});

app.get('/api/blog/categories', async () => {
  const db = store.read();
  return { categories: db.blogCategories };
});

app.post('/api/blog/categories', async (request, reply) => {
  const body = request.body || {};

  if (!body.name || !String(body.name).trim()) {
    return reply.code(400).send({ message: 'Category name is required' });
  }

  const created = store.mutate((db) => {
    const category = {
      id: issueId(db, 'blogCategories'),
      name: String(body.name).trim(),
      slug: uniqueSlug(body.slug || body.name, db.blogCategories),
      createdAt: getNowIso()
    };

    db.blogCategories.push(category);
    return db;
  });

  return reply.code(201).send({ category: created.blogCategories[created.blogCategories.length - 1] });
});

app.put('/api/blog/categories/:id', async (request, reply) => {
  const id = Number(request.params.id);
  const body = request.body || {};
  let updatedCategory = null;

  const updatedDb = store.mutate((db) => {
    const index = db.blogCategories.findIndex((item) => Number(item.id) === id);
    if (index < 0) {
      return db;
    }

    const current = db.blogCategories[index];
    const name = body.name !== undefined ? String(body.name).trim() : current.name;

    updatedCategory = {
      ...current,
      name,
      slug:
        body.slug !== undefined || body.name !== undefined
          ? uniqueSlug(body.slug || name, db.blogCategories, id)
          : current.slug
    };

    db.blogCategories[index] = updatedCategory;
    return db;
  });

  const exists = updatedDb.blogCategories.some((item) => Number(item.id) === id);
  if (!exists || !updatedCategory) {
    return reply.code(404).send({ message: 'Category not found' });
  }

  return { category: updatedCategory };
});

app.delete('/api/blog/categories/:id', async (request, reply) => {
  const id = Number(request.params.id);
  let removed = false;

  store.mutate((db) => {
    const next = db.blogCategories.filter((item) => Number(item.id) !== id);
    removed = next.length !== db.blogCategories.length;
    db.blogCategories = next;

    db.blogPosts = db.blogPosts.map((post) => {
      if (Number(post.categoryId) === id) {
        return {
          ...post,
          categoryId: null,
          updatedAt: getNowIso()
        };
      }

      return post;
    });

    return db;
  });

  if (!removed) {
    return reply.code(404).send({ message: 'Category not found' });
  }

  return { success: true };
});

app.get('/api/blog/posts', async () => {
  const db = store.read();
  return {
    posts: db.blogPosts.sort(byNewest).map((item) => withCategory(item, db))
  };
});

app.post('/api/blog/posts', async (request, reply) => {
  const body = request.body || {};

  if (!body.title || !String(body.title).trim()) {
    return reply.code(400).send({ message: 'Title is required' });
  }

  if (!body.content || !String(body.content).trim()) {
    return reply.code(400).send({ message: 'Content is required' });
  }

  const created = store.mutate((db) => {
    const requestedCategoryId =
      body.categoryId !== undefined && body.categoryId !== null && body.categoryId !== ''
        ? Number(body.categoryId)
        : null;

    const hasCategory =
      requestedCategoryId === null ||
      db.blogCategories.some((item) => Number(item.id) === requestedCategoryId);

    const post = {
      id: issueId(db, 'blogPosts'),
      title: String(body.title).trim(),
      slug: uniqueSlug(body.slug || body.title, db.blogPosts),
      excerpt: String(body.excerpt || '').trim(),
      content: sanitizeRichContent(body.content || ''),
      categoryId: hasCategory ? requestedCategoryId : null,
      coverUrl: sanitizePublicUrl(body.coverUrl || ''),
      isPublished: body.isPublished === undefined ? true : toBoolean(body.isPublished),
      createdAt: getNowIso(),
      updatedAt: getNowIso()
    };

    db.blogPosts.push(post);
    return db;
  });

  const inserted = created.blogPosts[created.blogPosts.length - 1];
  return reply.code(201).send({ post: withCategory(inserted, created) });
});

app.put('/api/blog/posts/:id', async (request, reply) => {
  const id = Number(request.params.id);
  const body = request.body || {};
  let updatedPost = null;

  const updatedDb = store.mutate((db) => {
    const index = db.blogPosts.findIndex((item) => Number(item.id) === id);
    if (index < 0) {
      return db;
    }

    const current = db.blogPosts[index];
    const nextTitle = body.title !== undefined ? String(body.title).trim() : current.title;

    let nextCategoryId = current.categoryId;
    if (body.categoryId !== undefined) {
      const requestedCategoryId =
        body.categoryId === null || body.categoryId === '' ? null : Number(body.categoryId);
      const hasCategory =
        requestedCategoryId === null ||
        db.blogCategories.some((item) => Number(item.id) === requestedCategoryId);
      nextCategoryId = hasCategory ? requestedCategoryId : current.categoryId;
    }

    updatedPost = {
      ...current,
      title: nextTitle,
      slug:
        body.slug !== undefined || body.title !== undefined
          ? uniqueSlug(body.slug || nextTitle, db.blogPosts, id)
          : current.slug,
      excerpt: body.excerpt !== undefined ? String(body.excerpt || '').trim() : current.excerpt,
      content:
        body.content !== undefined ? sanitizeRichContent(body.content || '') : current.content,
      categoryId: nextCategoryId,
      coverUrl:
        body.coverUrl !== undefined
          ? sanitizePublicUrl(body.coverUrl || '')
          : current.coverUrl,
      isPublished:
        body.isPublished !== undefined ? toBoolean(body.isPublished) : current.isPublished,
      updatedAt: getNowIso()
    };

    db.blogPosts[index] = updatedPost;
    return db;
  });

  const exists = updatedDb.blogPosts.some((item) => Number(item.id) === id);
  if (!exists || !updatedPost) {
    return reply.code(404).send({ message: 'Post not found' });
  }

  return { post: withCategory(updatedPost, updatedDb) };
});

app.delete('/api/blog/posts/:id', async (request, reply) => {
  const id = Number(request.params.id);
  let removed = false;

  store.mutate((db) => {
    const next = db.blogPosts.filter((item) => Number(item.id) !== id);
    removed = next.length !== db.blogPosts.length;
    db.blogPosts = next;
    return db;
  });

  if (!removed) {
    return reply.code(404).send({ message: 'Post not found' });
  }

  return { success: true };
});

app.get('/api/clients', async () => {
  const db = store.read();
  return { clients: db.clients.sort(byNewest) };
});

app.post('/api/clients', async (request, reply) => {
  const body = request.body || {};

  if (!body.name || !String(body.name).trim()) {
    return reply.code(400).send({ message: 'Client name is required' });
  }

  const created = store.mutate((db) => {
    const client = {
      id: issueId(db, 'clients'),
      name: String(body.name).trim(),
      logoUrl: String(body.logoUrl || '').trim(),
      website: String(body.website || '').trim(),
      testimonial: String(body.testimonial || '').trim(),
      createdAt: getNowIso()
    };

    db.clients.push(client);
    return db;
  });

  return reply.code(201).send({ client: created.clients[created.clients.length - 1] });
});

app.put('/api/clients/:id', async (request, reply) => {
  const id = Number(request.params.id);
  const body = request.body || {};
  let updatedClient = null;

  const updatedDb = store.mutate((db) => {
    const index = db.clients.findIndex((item) => Number(item.id) === id);
    if (index < 0) {
      return db;
    }

    const current = db.clients[index];

    updatedClient = {
      ...current,
      name: body.name !== undefined ? String(body.name).trim() : current.name,
      logoUrl: body.logoUrl !== undefined ? String(body.logoUrl || '').trim() : current.logoUrl,
      website: body.website !== undefined ? String(body.website || '').trim() : current.website,
      testimonial:
        body.testimonial !== undefined
          ? String(body.testimonial || '').trim()
          : current.testimonial
    };

    db.clients[index] = updatedClient;
    return db;
  });

  const exists = updatedDb.clients.some((item) => Number(item.id) === id);
  if (!exists || !updatedClient) {
    return reply.code(404).send({ message: 'Client not found' });
  }

  return { client: updatedClient };
});

app.delete('/api/clients/:id', async (request, reply) => {
  const id = Number(request.params.id);
  let removed = false;

  store.mutate((db) => {
    const next = db.clients.filter((item) => Number(item.id) !== id);
    removed = next.length !== db.clients.length;
    db.clients = next;
    return db;
  });

  if (!removed) {
    return reply.code(404).send({ message: 'Client not found' });
  }

  return { success: true };
});

app.get('/api/site/navigation', async () => {
  const db = store.read();
  return { navigation: db.site.navigation };
});

app.put('/api/site/navigation', async (request) => {
  const body = request.body || {};

  const updated = store.mutate((db) => {
    const items = Array.isArray(body.items)
      ? body.items
          .map((item) => ({
            label: String(item.label || '').trim(),
            href: String(item.href || '').trim()
          }))
          .filter((item) => item.label && item.href)
      : db.site.navigation.items;

    db.site.navigation = { items };
    return db;
  });

  return { navigation: updated.site.navigation };
});

app.get('/api/site/footer', async () => {
  const db = store.read();
  return { footer: db.site.footer };
});

app.put('/api/site/footer', async (request) => {
  const body = request.body || {};

  const updated = store.mutate((db) => {
    const socials = Array.isArray(body.socials)
      ? body.socials
          .map((item) => ({
            label: String(item.label || '').trim(),
            url: String(item.url || '').trim()
          }))
          .filter((item) => item.label && item.url)
      : db.site.footer.socials;

    db.site.footer = {
      aboutText:
        body.aboutText !== undefined
          ? String(body.aboutText || '').trim()
          : db.site.footer.aboutText,
      contactEmail:
        body.contactEmail !== undefined
          ? String(body.contactEmail || '').trim()
          : db.site.footer.contactEmail,
      whatsapp:
        body.whatsapp !== undefined
          ? String(body.whatsapp || '').trim()
          : db.site.footer.whatsapp,
      address:
        body.address !== undefined ? String(body.address || '').trim() : db.site.footer.address,
      socials,
      copyrightText:
        body.copyrightText !== undefined
          ? String(body.copyrightText || '').trim()
          : db.site.footer.copyrightText
    };

    return db;
  });

  return { footer: updated.site.footer };
});

app.get('/api/site/style', async () => {
  const db = store.read();
  return { style: db.site.style };
});

app.put('/api/site/style', async (request) => {
  const body = request.body || {};

  const updated = store.mutate((db) => {
    const requestedPalette =
      body.palette !== undefined ? String(body.palette || '').trim() : db.site.style.palette;
    const palette = getPaletteByKey(requestedPalette);

    const paletteColors = palette?.colors || db.site.style.colors || getDefaultStyleColors();
    const mergedColors = sanitizeStyleColors({
      ...paletteColors,
      ...(body.colors || {})
    });

    db.site.style = {
      palette: palette?.key || db.site.style.palette,
      colors: mergedColors
    };

    return db;
  });

  return { style: updated.site.style };
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (reply.sent) {
    return;
  }

  reply.code(500).send({
    message: 'Unexpected server error'
  });
});

app.listen({ port: PORT, host: HOST }).then(() => {
  app.log.info(`Backend ready on http://${HOST}:${PORT}`);
});
