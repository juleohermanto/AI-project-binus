# Backend — AI-Powered Productivity Assistant

REST API untuk aplikasi asisten produktivitas harian berbasis AI. Backend ini menangani autentikasi, manajemen tugas, brain dump berbasis Gemini, ringkasan harian, dan sesi fokus.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js 20+ |
| Language | TypeScript 5.9 |
| Framework | Express 5 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Validation | Zod 4 |
| Auth | JWT access token + refresh token rotation |
| Password Hashing | bcryptjs |
| AI | Google Gemini (`gemini-2.5-flash` default) |
| Date/Timezone | Luxon |
| Security | Helmet, CORS allowlist, rate limiting |

## Struktur Folder

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── 20261120000000_init/migration.sql
│       └── migration_lock.toml
├── src/
│   ├── ai/
│   │   ├── ai-provider.ts
│   │   ├── gemini-provider.ts
│   │   ├── mock-provider.ts
│   │   ├── json.ts
│   │   ├── index.ts
│   │   ├── prompts/brain-dump.prompt.ts
│   │   └── schemas/brain-dump.schema.ts
│   ├── config/env.ts
│   ├── lib/
│   │   ├── cookies.ts
│   │   ├── errors.ts
│   │   ├── password.ts
│   │   ├── prisma.ts
│   │   ├── time.ts
│   │   ├── tokens.ts
│   │   └── validators/common.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── not-found.ts
│   │   ├── rate-limit.ts
│   │   └── require-auth.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── brain-dump/
│   │   ├── focus-sessions/
│   │   ├── overview/
│   │   ├── tasks/
│   │   └── users/
│   ├── routes/
│   ├── types/express.d.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

Setiap domain di `src/modules/` memiliki `*.schema.ts`, `*.service.ts`, `*.controller.ts`, dan `*.routes.ts`. Business logic berada di service, validasi request di schema, dan HTTP handling di controller.

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Konfigurasi environment

Salin template (file `.env` sudah tersedia di mesin development dan di-ignore Git):

```bash
cp .env.example .env
```

Di Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Lalu edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
GEMINI_API_KEY="API_KEY_GEMINI_ANDA"
```

Untuk development tanpa API key Gemini, ubah:

```env
AI_PROVIDER=mock
```

`.env.example` berisi semua variabel yang tersedia beserta penjelasannya.

### 3. Terapkan migrasi database

Migration awal sudah tersedia di `prisma/migrations/`. Untuk menerapkannya ke Neon:

```bash
npm run prisma:deploy
```

Jika `DATABASE_URL` memakai host Neon `-pooler` (umum untuk runtime serverless), jalankan migrasi dengan connection string **direct** (tanpa `-pooler`) agar DDL dan advisory lock berjalan aman:

```bash
# bash
DATABASE_URL="postgresql://...@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require" npm run prisma:deploy
```

```powershell
# PowerShell
$env:DATABASE_URL="postgresql://...@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"; npm run prisma:deploy
```

Untuk membuat migration baru saat mengubah schema:

```bash
npm run prisma:migrate -- --name nama_perubahan
```

### 4. Jalankan server

```bash
npm run dev
```

Server berjalan di `http://localhost:4000`.

Cek kesehatan server:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/db
```

## Scripts

| Script | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server dengan `tsx watch` |
| `npm run build` | Prisma generate + compile TypeScript ke `dist/` |
| `npm start` | Menjalankan hasil build (`node dist/server.js`) |
| `npm run typecheck` | TypeScript check tanpa emit |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | `prisma migrate dev` untuk development |
| `npm run prisma:deploy` | `prisma migrate deploy` untuk staging/production |
| `npm run prisma:push` | `prisma db push` tanpa migration (prototyping) |
| `npm run prisma:studio` | Membuka Prisma Studio |
| `npm run prisma:format` | Format schema Prisma |

## Environment Variables

| Variable | Wajib | Default | Keterangan |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Tidak | `development` | `development`, `test`, atau `production` |
| `PORT` | Tidak | `4000` | Port HTTP server |
| `DATABASE_URL` | Ya | — | Connection string PostgreSQL/Neon |
| `JWT_ACCESS_SECRET` | Ya | — | Minimal 32 karakter |
| `JWT_REFRESH_SECRET` | Ya | — | Minimal 32 karakter, berbeda dari access secret |
| `ACCESS_TOKEN_TTL_MINUTES` | Tidak | `15` | Umur access token |
| `REFRESH_TOKEN_TTL_DAYS` | Tidak | `7` | Umur refresh token |
| `BCRYPT_ROUNDS` | Tidak | `10` | Cost factor bcrypt (8–15) |
| `COOKIE_SECURE` | Tidak | `false` | Wajib `true` di production HTTPS |
| `COOKIE_SAMESITE` | Tidak | `lax` | `lax`, `strict`, atau `none` |
| `COOKIE_DOMAIN` | Tidak | — | Domain cookie, misal `.example.com` |
| `CORS_ORIGIN` | Tidak | `http://localhost:3000` | Daftar origin dipisah koma |
| `AI_PROVIDER` | Tidak | `gemini` | `gemini` atau `mock` |
| `GEMINI_API_KEY` | Ya jika `gemini` | — | API key Google AI Studio |
| `GEMINI_MODEL` | Tidak | `gemini-2.5-flash` | Nama model Gemini |
| `GEMINI_API_BASE_URL` | Tidak | `https://generativelanguage.googleapis.com` | Base URL Gemini API |
| `AI_TIMEOUT_MS` | Tidak | `45000` | Timeout request AI |
| `APP_TIMEZONE` | Tidak | `Asia/Jakarta` | Timezone default untuk deadline dan overview |

## Ringkasan Endpoint

Semua endpoint bisnis berada di bawah `/api/v1`.

| Method | Path | Auth | Fungsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/signup` | — | Registrasi |
| `POST` | `/api/v1/auth/login` | — | Login |
| `POST` | `/api/v1/auth/refresh` | Cookie/body | Rotasi refresh token |
| `POST` | `/api/v1/auth/logout` | Cookie/body | Logout dan revoke refresh token |
| `GET` | `/api/v1/users/me` | Bearer | Profil pengguna |
| `PATCH` | `/api/v1/users/me` | Bearer | Update nama/email |
| `PATCH` | `/api/v1/users/me/password` | Bearer | Ganti password |
| `GET` | `/api/v1/tasks` | Bearer | Daftar tugas + filter + pagination |
| `POST` | `/api/v1/tasks` | Bearer | Buat tugas manual |
| `GET` | `/api/v1/tasks/:id` | Bearer | Detail tugas |
| `PATCH` | `/api/v1/tasks/:id` | Bearer | Update tugas |
| `DELETE` | `/api/v1/tasks/:id` | Bearer | Hapus tugas |
| `PATCH` | `/api/v1/tasks/:id/complete` | Bearer | Tandai tugas selesai |
| `PATCH` | `/api/v1/tasks/:id/reopen` | Bearer | Buka kembali tugas |
| `POST` | `/api/v1/tasks/:id/steps` | Bearer | Tambah micro-step |
| `PATCH` | `/api/v1/tasks/:id/steps/:stepId` | Bearer | Update micro-step |
| `DELETE` | `/api/v1/tasks/:id/steps/:stepId` | Bearer | Hapus micro-step |
| `PATCH` | `/api/v1/tasks/:id/steps/:stepId/complete` | Bearer | Selesaikan micro-step |
| `PATCH` | `/api/v1/tasks/:id/steps/:stepId/reopen` | Bearer | Buka kembali micro-step |
| `POST` | `/api/v1/brain-dump` | Bearer | AI brain dump + auto-breakdown |
| `GET` | `/api/v1/overview` | Bearer | Statistik harian + botanikal |
| `POST` | `/api/v1/focus-sessions` | Bearer | Mulai sesi fokus |
| `GET` | `/api/v1/focus-sessions` | Bearer | Riwayat sesi fokus |
| `GET` | `/api/v1/focus-sessions/active` | Bearer | Sesi fokus aktif |
| `GET` | `/api/v1/focus-sessions/:id` | Bearer | Detail sesi fokus |
| `PATCH` | `/api/v1/focus-sessions/:id/complete` | Bearer | Selesaikan sesi fokus |
| `PATCH` | `/api/v1/focus-sessions/:id/cancel` | Bearer | Batalkan sesi fokus |
| `GET` | `/health` | — | Health check server |
| `GET` | `/health/db` | — | Health check database |

Dokumentasi request/response lengkap: [`docs/backend_api.md`](../docs/backend_api.md).

## Authentication Flow

1. `POST /auth/signup` atau `POST /auth/login` mengembalikan `accessToken` di body dan menyimpan `refreshToken` di cookie `httpOnly` (`refresh_token`).
2. Frontend mengirim access token melalui header `Authorization: Bearer <accessToken>`.
3. Saat access token kedaluwarsa (`401 ACCESS_TOKEN_EXPIRED`), frontend memanggil `POST /auth/refresh` dengan `credentials: 'include'`.
4. Refresh token dirotasi: token lama direvoke, token baru disimpan di cookie.
5. `POST /auth/logout` merevoke refresh token dan menghapus cookie.

Catatan keamanan:

- Refresh token **tidak** dikembalikan di body JSON secara default.
- Setiap refresh token disimpan sebagai hash SHA-256 di database.
- Ganti password akan merevoke seluruh refresh token pengguna dan menerbitkan pasangan token baru.
- Semua query data selalu dibatasi oleh `userId` dari access token.

## AI Provider

- `AI_PROVIDER=gemini` menggunakan Gemini API dengan `responseMimeType: application/json`.
- `AI_PROVIDER=mock` menghasilkan tugas dummy dari baris input, berguna untuk development tanpa API key.
- AI diminta mengembalikan JSON terstruktur; server memvalidasi dengan Zod.
- Jika respons AI tidak valid, server mencoba sekali lagi dengan prompt perbaikan.
- `priorityLevel` selalu diturunkan ulang oleh server dari `priorityScore` (>=70 HIGH, 40–69 MEDIUM, <40 LOW).
- Deadline relatif seperti "besok" dan "Jumat" diselesaikan AI berdasarkan tanggal/waktu dan timezone yang dikirim server.

## Deployment

Contoh untuk Render/Railway/VPS:

```bash
npm ci
npm run build
npx prisma migrate deploy
npm start
```

Environment production yang perlu diperhatikan:

```env
NODE_ENV=production
COOKIE_SECURE=true
# Jika frontend dan API berbeda site (misal Vercel + domain API terpisah):
COOKIE_SAMESITE=none
CORS_ORIGIN=https://frontend-anda.vercel.app
```

Jika backend dan frontend berada di domain yang sama (misal `app.example.com` dan `api.example.com` dengan parent domain yang sama), `COOKIE_SAMESITE=lax` masih dapat digunakan dan lebih aman.

## Verifikasi

```bash
npm run typecheck
npm run build
```

Health check setelah server berjalan:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/db
```
