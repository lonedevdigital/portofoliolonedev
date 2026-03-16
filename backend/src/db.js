import Database from 'better-sqlite3';
import sanitizeHtml from 'sanitize-html';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const defaultStyleColors = {
  pageBg: '#f7f8fb',
  heroBg: '#06d6a0',
  heroText: '#073b4c',
  productBg: '#ffffff',
  productText: '#1f2937',
  blogBg: '#f1f5f9',
  blogText: '#1e293b',
  pricingBg: '#ffd166',
  pricingText: '#3f3f46',
  clientsBg: '#ffffff',
  clientsText: '#1f2937',
  footerBg: '#073b4c',
  footerText: '#f8fafc',
  primaryButton: '#118ab2',
  secondaryButton: '#ef476f',
  cardBg: '#ffffff',
  cardBorder: '#dbe4ef'
};

const styleContrastPairs = [
  ['heroBg', 'heroText'],
  ['productBg', 'productText'],
  ['blogBg', 'blogText'],
  ['pricingBg', 'pricingText'],
  ['clientsBg', 'clientsText'],
  ['footerBg', 'footerText']
];

const richTextSanitizeOptions = {
  allowedTags: [
    'p',
    'br',
    'h2',
    'h3',
    'h4',
    'h5',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'a',
    'img',
    'hr'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https']
  }
};

function plainTextToHtml(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return '';
  }

  const blocks = raw
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const escaped = sanitizeHtml(segment, {
        allowedTags: [],
        allowedAttributes: {}
      }).replace(/\n/g, '<br />');

      return `<p>${escaped}</p>`;
    });

  return blocks.join('');
}

export function sanitizePublicUrl(input) {
  const value = String(input || '').trim();
  if (!value) {
    return '';
  }

  return /^(https?:\/\/|\/)/i.test(value) ? value : '';
}

export function sanitizeRichContent(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return '';
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  const candidate = looksLikeHtml ? raw : plainTextToHtml(raw);
  return sanitizeHtml(candidate, richTextSanitizeOptions).trim();
}

function parseHexColor(colorValue) {
  if (typeof colorValue !== 'string') {
    return null;
  }

  const value = colorValue.trim().toLowerCase();
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(value);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16)
    };
  }

  const fullMatch = /^#([0-9a-f]{6})$/i.exec(value);
  if (!fullMatch) {
    return null;
  }

  return {
    r: Number.parseInt(fullMatch[1].slice(0, 2), 16),
    g: Number.parseInt(fullMatch[1].slice(2, 4), 16),
    b: Number.parseInt(fullMatch[1].slice(4, 6), 16)
  };
}

function isNearWhite(colorValue) {
  const rgb = parseHexColor(colorValue);
  if (!rgb) {
    return false;
  }

  return rgb.r >= 244 && rgb.g >= 244 && rgb.b >= 244;
}

export function enforceReadableStyleColors(colors = {}) {
  const next = { ...defaultStyleColors, ...(colors || {}) };

  for (const [bgKey, textKey] of styleContrastPairs) {
    if (isNearWhite(next[bgKey]) && isNearWhite(next[textKey])) {
      next[textKey] = '#0f172a';
    }
  }

  return next;
}

export const paletteLibrary = [
  {
    key: 'ocean-flat',
    name: 'Ocean Flat',
    colors: {
      pageBg: '#f7f8fb',
      heroBg: '#06d6a0',
      heroText: '#073b4c',
      productBg: '#ffffff',
      productText: '#1f2937',
      blogBg: '#f1f5f9',
      blogText: '#1e293b',
      pricingBg: '#ffd166',
      pricingText: '#3f3f46',
      clientsBg: '#ffffff',
      clientsText: '#1f2937',
      footerBg: '#073b4c',
      footerText: '#f8fafc',
      primaryButton: '#118ab2',
      secondaryButton: '#ef476f',
      cardBg: '#ffffff',
      cardBorder: '#dbe4ef'
    }
  },
  {
    key: 'citrus-flat',
    name: 'Citrus Flat',
    colors: {
      pageBg: '#fffdf4',
      heroBg: '#ffb703',
      heroText: '#3d2c08',
      productBg: '#ffffff',
      productText: '#3d2c08',
      blogBg: '#fff5d6',
      blogText: '#3f3f46',
      pricingBg: '#fb8500',
      pricingText: '#ffffff',
      clientsBg: '#ffffff',
      clientsText: '#3f3f46',
      footerBg: '#2f4858',
      footerText: '#fef3c7',
      primaryButton: '#219ebc',
      secondaryButton: '#8ecae6',
      cardBg: '#ffffff',
      cardBorder: '#fcd34d'
    }
  },
  {
    key: 'terra-flat',
    name: 'Terra Flat',
    colors: {
      pageBg: '#f8f4f1',
      heroBg: '#e07a5f',
      heroText: '#1f2933',
      productBg: '#ffffff',
      productText: '#2f3e46',
      blogBg: '#f2e9e4',
      blogText: '#22223b',
      pricingBg: '#f2cc8f',
      pricingText: '#3d405b',
      clientsBg: '#ffffff',
      clientsText: '#2f3e46',
      footerBg: '#3d405b',
      footerText: '#f4f1de',
      primaryButton: '#81b29a',
      secondaryButton: '#e07a5f',
      cardBg: '#ffffff',
      cardBorder: '#ded7ce'
    }
  },
  {
    key: 'slate-flat',
    name: 'Slate Flat',
    colors: {
      pageBg: '#f1f5f9',
      heroBg: '#38bdf8',
      heroText: '#0f172a',
      productBg: '#ffffff',
      productText: '#0f172a',
      blogBg: '#e2e8f0',
      blogText: '#1e293b',
      pricingBg: '#94a3b8',
      pricingText: '#0f172a',
      clientsBg: '#ffffff',
      clientsText: '#1e293b',
      footerBg: '#0f172a',
      footerText: '#e2e8f0',
      primaryButton: '#0ea5e9',
      secondaryButton: '#f97316',
      cardBg: '#ffffff',
      cardBorder: '#cbd5e1'
    }
  },
  {
    key: 'aurora-flat',
    name: 'Aurora Flat',
    colors: {
      pageBg: '#f8fafc',
      heroBg: '#22d3ee',
      heroText: '#083344',
      productBg: '#ffffff',
      productText: '#1e293b',
      blogBg: '#ecfeff',
      blogText: '#155e75',
      pricingBg: '#34d399',
      pricingText: '#052e16',
      clientsBg: '#ffffff',
      clientsText: '#0f172a',
      footerBg: '#0b132b',
      footerText: '#e2e8f0',
      primaryButton: '#06b6d4',
      secondaryButton: '#10b981',
      cardBg: '#ffffff',
      cardBorder: '#bae6fd'
    }
  }
];

function nowIso() {
  return new Date().toISOString();
}

function nextId(collection) {
  if (!collection.length) {
    return 1;
  }

  return Math.max(...collection.map((item) => Number(item.id) || 0)) + 1;
}

export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function createSeedData() {
  const createdAt = nowIso();
  const categories = [
    { id: 1, name: 'Web Development', slug: 'web-development', createdAt },
    { id: 2, name: 'Automation', slug: 'automation', createdAt }
  ];

  const products = [
    {
      id: 1,
      slug: 'landing-page-pro',
      name: 'Landing Page Pro',
      shortDescription: 'Satu halaman modern untuk branding dan lead generation.',
      detail: '<p>Termasuk copywriting struktur section, form lead, analytics script, dan optimasi performa.</p>',
      price: 350,
      currency: 'USD',
      category: 'Website',
      imageUrl: '',
      isFeatured: true,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 2,
      slug: 'website-company-profile',
      name: 'Website Company Profile',
      shortDescription: 'Website multi halaman untuk profil bisnis dan portofolio.',
      detail: '<p>Termasuk halaman home, layanan, proyek, kontak, dan dashboard update konten dasar.</p>',
      price: 900,
      currency: 'USD',
      category: 'Website',
      imageUrl: '',
      isFeatured: true,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 3,
      slug: 'workflow-automation',
      name: 'Workflow Automation',
      shortDescription: 'Automasi proses internal untuk menghemat waktu tim.',
      detail: '<p>Integrasi form, email, notifikasi, dan sinkron data antar tools.</p>',
      price: 500,
      currency: 'USD',
      category: 'Automation',
      imageUrl: '',
      isFeatured: false,
      createdAt,
      updatedAt: createdAt
    }
  ];

  const posts = [
    {
      id: 1,
      title: 'Cara Menyusun Web Service Portfolio yang Menjual',
      slug: 'cara-menyusun-web-service-portfolio-yang-menjual',
      excerpt: 'Framework sederhana untuk menampilkan layanan, bukti sosial, dan pricing.',
      content: 'Mulai dari value proposition yang jelas, lanjutkan dengan studi kasus, lalu akhiri dengan CTA yang tegas agar visitor mudah mengambil keputusan.',
      categoryId: 1,
      coverUrl: '',
      isPublished: true,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 2,
      title: 'Checklist SEO Dasar untuk Website Jasa',
      slug: 'checklist-seo-dasar-untuk-website-jasa',
      excerpt: 'Pondasi SEO on-page yang paling berdampak untuk website jasa.',
      content: 'Pastikan title tag relevan, struktur heading rapi, loading cepat, dan konten menjawab intent user secara langsung.',
      categoryId: 1,
      coverUrl: '',
      isPublished: true,
      createdAt,
      updatedAt: createdAt
    }
  ];

  const clients = [
    {
      id: 1,
      name: 'Astra Digital',
      logoUrl: '',
      website: 'https://example.com',
      testimonial: 'Implementasi cepat, komunikatif, dan hasil desainnya clean.',
      createdAt
    },
    {
      id: 2,
      name: 'Nusa Retail',
      logoUrl: '',
      website: 'https://example.com',
      testimonial: 'Konversi inquiry naik setelah redesign website.',
      createdAt
    }
  ];

  return {
    products,
    blogCategories: categories,
    blogPosts: posts,
    clients,
    auth: {
      admin: null,
      sessions: []
    },
    site: {
      hero: {
        badgeText: 'Web Services Portfolio',
        title: 'Bangun Website Jasa yang Modern, Cepat, dan Mudah Dikelola',
        description:
          'Tampilkan portfolio project, publish artikel blog, atur pricing produk, dan kelola semuanya lewat admin dashboard yang sederhana.',
        primaryButtonLabel: 'Lihat Pricing',
        primaryButtonHref: '/pricing',
        secondaryButtonLabel: 'Baca Blog',
        secondaryButtonHref: '/blog',
        adminButtonLabel: 'Masuk Admin',
        adminButtonHref: '/admin'
      },
      navigation: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Blog', href: '/blog' },
          { label: 'Admin', href: '/admin' }
        ]
      },
      footer: {
        aboutText: 'Kami membantu bisnis membangun web services yang modern, cepat, dan mudah dikelola.',
        contactEmail: 'hello@lonedev.dev',
        whatsapp: '+62-812-0000-0000',
        address: 'Jakarta, Indonesia',
        socials: [
          { label: 'LinkedIn', url: 'https://linkedin.com' },
          { label: 'Instagram', url: 'https://instagram.com' }
        ],
        copyrightText: 'Copyright 2026 LoneDev. All rights reserved.'
      },
      style: {
        palette: 'ocean-flat',
        colors: { ...defaultStyleColors }
      }
    },
    visits: [],
    meta: {
      nextIds: {
        products: nextId(products),
        blogCategories: nextId(categories),
        blogPosts: nextId(posts),
        clients: nextId(clients),
        visits: 1
      }
    }
  };
}

function normalizeDbShape(db) {
  const seed = createSeedData();
  const rawProducts = Array.isArray(db.products) ? db.products : seed.products;
  const rawCategories = Array.isArray(db.blogCategories)
    ? db.blogCategories
    : seed.blogCategories;
  const rawPosts = Array.isArray(db.blogPosts) ? db.blogPosts : seed.blogPosts;
  const rawClients = Array.isArray(db.clients) ? db.clients : seed.clients;
  const rawVisits = Array.isArray(db.visits) ? db.visits : seed.visits;

  const products = rawProducts.map((item) => ({
    ...item,
    name: String(item.name || '').trim(),
    slug: String(item.slug || '').trim(),
    shortDescription: String(item.shortDescription || '').trim(),
    detail: sanitizeRichContent(item.detail || ''),
    category: String(item.category || 'General').trim() || 'General',
    currency: String(item.currency || 'USD').trim() || 'USD',
    imageUrl: sanitizePublicUrl(item.imageUrl || ''),
    isFeatured: Boolean(item.isFeatured)
  }));

  const blogCategories = rawCategories.map((item) => ({
    ...item,
    name: String(item.name || '').trim(),
    slug: String(item.slug || '').trim()
  }));

  const blogPosts = rawPosts.map((item) => ({
    ...item,
    title: String(item.title || '').trim(),
    slug: String(item.slug || '').trim(),
    excerpt: String(item.excerpt || '').trim(),
    content: sanitizeRichContent(item.content || ''),
    coverUrl: sanitizePublicUrl(item.coverUrl || ''),
    isPublished: Boolean(item.isPublished)
  }));

  const clients = rawClients.map((item) => ({
    ...item,
    name: String(item.name || '').trim(),
    logoUrl: sanitizePublicUrl(item.logoUrl || ''),
    website: sanitizePublicUrl(item.website || ''),
    testimonial: String(item.testimonial || '').trim()
  }));

  const rawHero = db.site?.hero ?? {};
  const seedHero = seed.site.hero;

  const hero = {
    badgeText:
      rawHero.badgeText !== undefined
        ? String(rawHero.badgeText || '').trim()
        : seedHero.badgeText,
    title:
      rawHero.title !== undefined ? String(rawHero.title || '').trim() : seedHero.title,
    description:
      rawHero.description !== undefined
        ? String(rawHero.description || '').trim()
        : seedHero.description,
    primaryButtonLabel:
      rawHero.primaryButtonLabel !== undefined
        ? String(rawHero.primaryButtonLabel || '').trim()
        : seedHero.primaryButtonLabel,
    primaryButtonHref:
      rawHero.primaryButtonHref !== undefined
        ? String(rawHero.primaryButtonHref || '').trim()
        : seedHero.primaryButtonHref,
    secondaryButtonLabel:
      rawHero.secondaryButtonLabel !== undefined
        ? String(rawHero.secondaryButtonLabel || '').trim()
        : seedHero.secondaryButtonLabel,
    secondaryButtonHref:
      rawHero.secondaryButtonHref !== undefined
        ? String(rawHero.secondaryButtonHref || '').trim()
        : seedHero.secondaryButtonHref,
    adminButtonLabel:
      rawHero.adminButtonLabel !== undefined
        ? String(rawHero.adminButtonLabel || '').trim()
        : seedHero.adminButtonLabel,
    adminButtonHref:
      rawHero.adminButtonHref !== undefined
        ? String(rawHero.adminButtonHref || '').trim()
        : seedHero.adminButtonHref
  };

  return {
    products,
    blogCategories,
    blogPosts,
    clients,
    auth: {
      admin:
        db.auth?.admin &&
        typeof db.auth.admin === 'object' &&
        typeof db.auth.admin.email === 'string'
          ? db.auth.admin
          : null,
      sessions: Array.isArray(db.auth?.sessions) ? db.auth.sessions : []
    },
    site: {
      hero,
      navigation: db.site?.navigation ?? seed.site.navigation,
      footer: db.site?.footer ?? seed.site.footer,
      style: {
        palette: db.site?.style?.palette ?? seed.site.style.palette,
        colors: enforceReadableStyleColors({
          ...defaultStyleColors,
          ...(db.site?.style?.colors ?? seed.site.style.colors)
        })
      }
    },
    visits: rawVisits,
    meta: {
      nextIds: {
        products: db.meta?.nextIds?.products ?? nextId(products),
        blogCategories: db.meta?.nextIds?.blogCategories ?? nextId(blogCategories),
        blogPosts: db.meta?.nextIds?.blogPosts ?? nextId(blogPosts),
        clients: db.meta?.nextIds?.clients ?? nextId(clients),
        visits: db.meta?.nextIds?.visits ?? nextId(rawVisits)
      }
    }
  };
}

function readLegacyJson(path) {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export class JsonStore {
  constructor(filePath, options = {}) {
    this.filePath = resolve(filePath);
    this.legacyJsonPath = options.legacyJsonPath
      ? resolve(options.legacyJsonPath)
      : resolve(dirname(this.filePath), 'db.json');

    this._ensureDirectory();
    this.db = new Database(this.filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.insertStateStmt = this.db.prepare(`
      INSERT INTO app_state (id, payload, updated_at)
      VALUES (1, @payload, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at;
    `);

    this.selectStateStmt = this.db.prepare('SELECT payload FROM app_state WHERE id = 1');

    this._ensureState();
  }

  _ensureDirectory() {
    const parent = dirname(this.filePath);
    if (!existsSync(parent)) {
      mkdirSync(parent, { recursive: true });
    }
  }

  _fallbackState() {
    const legacy = readLegacyJson(this.legacyJsonPath);
    if (legacy) {
      return normalizeDbShape(legacy);
    }

    return createSeedData();
  }

  _ensureState() {
    const row = this.selectStateStmt.get();

    if (!row) {
      this.write(this._fallbackState());
      return;
    }

    try {
      const parsed = JSON.parse(row.payload);
      this.write(normalizeDbShape(parsed));
    } catch {
      this.write(this._fallbackState());
    }
  }

  read() {
    const row = this.selectStateStmt.get();

    if (!row) {
      const seeded = this._fallbackState();
      this.write(seeded);
      return normalizeDbShape(seeded);
    }

    try {
      return normalizeDbShape(JSON.parse(row.payload));
    } catch {
      const seeded = this._fallbackState();
      this.write(seeded);
      return normalizeDbShape(seeded);
    }
  }

  write(data) {
    const normalized = normalizeDbShape(data);
    this.insertStateStmt.run({
      payload: JSON.stringify(normalized),
      updatedAt: nowIso()
    });
    return normalized;
  }

  mutate(mutator) {
    const tx = this.db.transaction((mutationFn) => {
      const current = this.read();
      const next = mutationFn(structuredClone(current)) ?? current;
      return this.write(next);
    });

    return tx(mutator);
  }

  createId(scope) {
    let createdId = 1;

    this.mutate((db) => {
      const current = Number(db.meta.nextIds[scope] ?? 1);
      createdId = current;
      db.meta.nextIds[scope] = current + 1;
      return db;
    });

    return createdId;
  }
}

export const SqliteStore = JsonStore;

export function getDefaultStyleColors() {
  return { ...defaultStyleColors };
}

export function getPaletteByKey(key) {
  return paletteLibrary.find((palette) => palette.key === key);
}

export function getNowIso() {
  return nowIso();
}
