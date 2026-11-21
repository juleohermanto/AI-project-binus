# Backend Implementation Plan

Dokumen ini mencatat keputusan teknis dan status implementasi backend untuk **AI-Powered Productivity Assistant**. Dokumen ini melengkapi `docs/product_overview.md` dan `docs/backend_api.md`.

## 1. Tujuan

Menyediakan REST API yang mendukung:

- AI Brain Dump & auto-breakdown.
- Daily overview dan workload.
- Structured task management dengan micro-step.
- Botanical focus timer.
- Account management dengan isolasi data per pengguna.

## 2. Keputusan Teknis

| Area | Rencana Awal | Keputusan Implementasi | Alasan |
| :--- | :--- | :--- | :--- |
| Backend | Next.js Route Handlers | **Express 5 + TypeScript** | Repo memisahkan `frontend/` dan `backend/`; backend berdiri sendiri dan lebih mudah dibagi antar anggota tim. |
| Auth | Better Auth | **JWT access + refresh token rotation** | Frontend dan backend terpisah; kontrol penuh atas cookie, rotasi token, dan revoke session. |
| Database | Neon PostgreSQL | **Neon PostgreSQL + Prisma 6** | Sesuai rencana; migration SQL sudah disertakan. |
| AI | LLM API | **Google Gemini (`gemini-2.5-flash`)** | Free tier tersedia; provider abstraction memudahkan penggantian model. |
| Validation | Zod | **Zod 4** | Validasi request, query, dan output AI. |
| Timezone | Tidak ditentukan | **Luxon + `Asia/Jakarta` default** | Deadline relatif dan overview harian butuh perhitungan timezone yang benar. |
| Arsitektur | Modular Monolith | **Modular Monolith** | Setiap domain memiliki schema, service, controller, dan routes sendiri. |

## 3. Struktur Modul

| Modul | Tanggung Jawab |
| :--- | :--- |
| `auth` | Signup, login, refresh, logout, password hashing, token rotation. |
| `users` | Profil pengguna, update nama/email, ganti password. |
| `tasks` | CRUD tugas, status, prioritas, micro-step, progress. |
| `brain-dump` | Memanggil AI, validasi output, menyimpan tugas hasil breakdown. |
| `overview` | Statistik harian, workload, rekomendasi tugas, botanical growth. |
| `focus-sessions` | Mulai/selesai/batalkan sesi fokus, riwayat, sesi aktif. |

Layer pendukung:

- `src/ai/` — provider abstraction, prompt, skema output AI, parsing JSON.
- `src/lib/` — Prisma client, JWT, cookie, password, timezone, error, validator umum.
- `src/middleware/` — autentikasi, error handler, 404, rate limit.
- `src/routes/` — penggabungan route `/api/v1` dan health check.

## 4. Data Model

| Model | Field Penting |
| :--- | :--- |
| `User` | `id`, `email` (unique), `name`, `passwordHash` |
| `RefreshToken` | `tokenHash` (unique), `userId`, `expiresAt`, `revokedAt` |
| `Task` | `userId`, `title`, `estimatedMinutes`, `priorityScore`, `priorityLevel`, `deadline`, `status`, `source`, `completedAt` |
| `MicroStep` | `taskId`, `title`, `estimatedMinutes`, `order`, `isCompleted`, `completedAt` |
| `FocusSession` | `userId`, `taskId`, `microStepId`, `durationMinutes`, `status`, `motivationalMessage`, `startedAt`, `endedAt` |

Aturan penting:

- Semua data bisnis memiliki `userId` dan selalu difilter berdasarkan pengguna yang terautentikasi.
- Menghapus `Task` akan menghapus `MicroStep` dan `FocusSession` terkait (cascade).
- Menghapus `MicroStep` akan mengosongkan `FocusSession.microStepId` (set null).
- `priorityLevel` selalu diturunkan server dari `priorityScore`.

## 5. Endpoint yang Diimplementasikan

### Auth & Users

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/password`

### Tasks & Micro-steps

- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id/complete`
- `PATCH /api/v1/tasks/:id/reopen`
- `POST /api/v1/tasks/:id/steps`
- `PATCH /api/v1/tasks/:id/steps/:stepId`
- `DELETE /api/v1/tasks/:id/steps/:stepId`
- `PATCH /api/v1/tasks/:id/steps/:stepId/complete`
- `PATCH /api/v1/tasks/:id/steps/:stepId/reopen`

### AI & Overview

- `POST /api/v1/brain-dump`
- `GET /api/v1/overview`

### Focus Sessions

- `POST /api/v1/focus-sessions`
- `GET /api/v1/focus-sessions`
- `GET /api/v1/focus-sessions/active`
- `GET /api/v1/focus-sessions/:id`
- `PATCH /api/v1/focus-sessions/:id/complete`
- `PATCH /api/v1/focus-sessions/:id/cancel`

### Health

- `GET /health`
- `GET /health/db`
- `GET /api/v1/health`
- `GET /api/v1/health/db`

## 6. AI Pipeline

```text
User text
   │
   ▼
Zod request validation (10–5000 karakter)
   │
   ▼
System prompt + current datetime + timezone
   │
   ▼
Gemini generateContent (JSON MIME type)
   │
   ▼
Extract JSON → normalize → Zod validation
   │
   ├── valid ──────────────┐
   │                       ▼
   └── invalid → repair prompt (1x) → validate → still invalid? 502
                           │
                           ▼
              Simpan Task + MicroStep dalam transaction
                           │
                           ▼
                 Response 201 + meta provider
```

Prinsip prompt:

- Output hanya JSON.
- Maksimal 10 tugas.
- Micro-step pertama 5–15 menit dan berupa aksi fisik konkret.
- Deadline relatif diselesaikan berdasarkan waktu server dan timezone pengguna.
- Prioritas mempertimbangkan deadline, dampak, dan effort.

## 7. Keamanan

- Password di-hash dengan bcrypt (cost default 10).
- Access token JWT berumur pendek (15 menit default).
- Refresh token disimpan sebagai hash SHA-256, dirotasi setiap refresh, dan dapat direvoke.
- Refresh token dikirim melalui cookie `httpOnly`, bukan body JSON.
- Semua endpoint data memakai `requireAuth` dan query ber-scope `userId`.
- Validasi input dengan Zod; error tidak membocorkan stack trace.
- Helmet, CORS allowlist, dan rate limit pada auth/brain dump.
- `COOKIE_SAMESITE=none` dipaksa memakai `COOKIE_SECURE=true`.

## 8. Status Implementasi

| Item | Status |
| :--- | :---: |
| Setup Express + TypeScript + Prisma | Selesai |
| Environment validation | Selesai |
| Prisma schema + migration awal | Selesai |
| Auth JWT + refresh rotation | Selesai |
| Users profile + password change | Selesai |
| Tasks CRUD + filter + pagination | Selesai |
| Micro-step management | Selesai |
| Brain dump + Gemini + repair retry | Selesai |
| Mock AI provider | Selesai |
| Daily overview + botanical growth | Selesai |
| Focus sessions | Selesai |
| Error handling + rate limit + CORS | Selesai |
| Dokumentasi API | Selesai |
| Typecheck + production build | Selesai |
| Uji endpoint non-database | Selesai |
| Migrasi ke Neon + uji end-to-end dengan database | Menunggu `DATABASE_URL` |
| Uji end-to-end dengan Gemini asli | Menunggu `GEMINI_API_KEY` |
| Aset botanikal frontend | Belum (di luar backend) |
| Frontend integration | Belum (tim frontend) |

## 9. Langkah Berikutnya

1. Isi `DATABASE_URL` Neon di `backend/.env`.
2. Jalankan `npm run prisma:deploy`.
3. Isi `GEMINI_API_KEY` atau set `AI_PROVIDER=mock`.
4. Jalankan `npm run dev`.
5. Uji alur: signup → brain dump → mulai focus session → selesaikan micro-step → overview.
6. Frontend menggunakan kontrak di `docs/backend_api.md`.
7. Siapkan aset SVG botanikal di `frontend/public/assets/botanical/` sesuai nama pada response overview.
