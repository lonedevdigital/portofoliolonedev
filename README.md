# LoneDev Portfolio Web Services

Aplikasi fullstack untuk portfolio web services dengan fitur:

- Halaman public modern flat design
- Product catalog + pricing
- Blog + category
- Client testimonials
- Admin dashboard:
  - Dashboard statistik pengunjung
  - Product
  - Blog
  - Clients
  - Footer
  - Navigation
  - Style (palette + custom section color + preview)
- Authentication administrator:
  - `/login` untuk setup akun admin pertama (sekali saja)
  - Setelah akun pertama dibuat, fitur create account dinonaktifkan
  - Login/logout session berbasis HTTP-only cookie

## Stack

- Backend: Fastify (SQLite storage)
- Frontend: SvelteKit
- Styling: Tailwind CSS
- Deployment: Docker Compose (friendly untuk Coolify)

## Struktur

- `backend/` API service
- `frontend/` SvelteKit app
- `docker-compose.yml` deployment 2 service

## Menjalankan Lokal (tanpa Docker)

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend default: `http://localhost:3001`
Default SQLite file: `backend/data/app.db`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:4173`

Frontend sudah memakai proxy `/api/*` internal ke backend.
Jika backend lokal Anda bukan `localhost:3001`, set env berikut saat menjalankan frontend:

```bash
BACKEND_INTERNAL_URL=http://localhost:3001
```

Tips CORS production:

- Simpan `PUBLIC_API_BASE_URL` kosong agar browser tetap call same-origin `/api/*`.
- Jika Anda pakai direct API domain (misalnya `https://api.domain.com`), backend harus set:
  - `CORS_ORIGIN=https://frontend-domain.com`
  - `CORS_CREDENTIALS=true`

## Menjalankan dengan Docker Compose

```bash
docker compose up -d --build
```

Catatan untuk Coolify:

- Compose ini **tidak hardcode host ports** (menggunakan `expose`).
- Port internal container dibuat **fixed** (`3001` backend, `4173` frontend) untuk kompatibilitas parser env Coolify.
- Routing/public port tetap dikelola dinamis oleh Coolify.
- Frontend memanggil backend via proxy internal `http://backend:3001`.
- Backend CORS credentials sudah aktif (`CORS_CREDENTIALS=true`) untuk kebutuhan login cookie lintas origin.
- Coolify bisa mengelola routing/public port tanpa bentrok dengan project lain.
- Backend otomatis migrasi data legacy `db.json` ke SQLite `app.db` saat pertama start jika file lama tersedia.

## Endpoint Utama Backend

- `GET /health`
- `GET /api/auth/setup-status`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/dashboard`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/blog/categories`
- `GET/POST/PUT/DELETE /api/blog/posts`
- `GET/POST/PUT/DELETE /api/clients`
- `GET/PUT /api/site/navigation`
- `GET/PUT /api/site/footer`
- `GET/PUT /api/site/style`
- `GET /api/site/palettes`
- `GET /api/public/home`
- `GET /api/public/products`
- `GET /api/public/blog`
- `GET /api/public/blog/:slug`
- `POST /api/visits`
