# AI-project-binus

AI-powered anti-procrastination & task management assistant — Group 7.

Aplikasi ini mengubah brain dump yang berantakan menjadi tugas terprioritaskan dan micro-step 5–15 menit, lalu menemani pengguna menyelesaikannya lewat fokus timer dan visual pertumbuhan tanaman.

## Struktur Folder Proyek

```text
AI-project-binus/
├── frontend/          # Aplikasi frontend (Evan)
├── backend/           # REST API (Michael & Juleo)
│   ├── prisma/        # Schema & migration database
│   ├── src/
│   │   ├── ai/        # Provider Gemini, prompt, skema JSON AI
│   │   ├── modules/   # auth, users, tasks, brain-dump, overview, focus-sessions
│   │   ├── lib/       # Prisma, JWT, cookie, timezone, error, validator
│   │   ├── middleware/
│   │   └── routes/
│   ├── .env.example
│   └── README.md
├── docs/              # Dokumentasi & test cases QA (Jasmine/Madeline)
│   ├── product_overview.md
│   ├── backend_api.md
│   └── backend_implementation_plan.md
├── .gitignore
└── README.md
```

## Backend

Backend berupa REST API mandiri dengan **Express 5 + TypeScript**, **Prisma 6**, **Neon PostgreSQL**, **JWT access/refresh token**, dan **Google Gemini** untuk brain dump.

### Quick Start

```bash
cd backend
npm install
# edit backend/.env: isi DATABASE_URL dan GEMINI_API_KEY
npm run prisma:deploy
npm run dev
```

Server berjalan di `http://localhost:4000`.

- Tanpa API key Gemini: set `AI_PROVIDER=mock` di `backend/.env`.
- Health check: `GET /health` dan `GET /health/db`.
- Dokumentasi lengkap: [`backend/README.md`](backend/README.md).
- Kontrak API: [`docs/backend_api.md`](docs/backend_api.md).

### Scripts Backend

```bash
npm run dev             # development (tsx watch)
npm run build           # prisma generate + tsc
npm start               # jalankan hasil build
npm run typecheck       # cek TypeScript
npm run prisma:deploy   # terapkan migration ke Neon
npm run prisma:studio   # buka Prisma Studio
```

## Dokumentasi

- [`docs/product_overview.md`](docs/product_overview.md) — konsep produk, fitur, dan arahan visual.
- [`docs/backend_api.md`](docs/backend_api.md) — referensi endpoint, auth flow, contoh request/response, AI contract, dan error codes.
- [`docs/backend_implementation_plan.md`](docs/backend_implementation_plan.md) — keputusan teknis, status implementasi, dan langkah berikutnya.

## Pembagian Tim

| Area | PIC |
| :--- | :--- |
| Frontend | Evan |
| Backend — API & server | Michael |
| Backend — AI prompt & logic | Juleo |
| QA & dokumentasi | Jasmine / Madeline |
