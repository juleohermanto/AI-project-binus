# Backend API Reference

Dokumentasi kontrak REST API untuk **AI-Powered Productivity Assistant**.

- **Base URL lokal:** `http://localhost:4000/api/v1`
- **Base URL production:** `https://<backend-domain>/api/v1`
- **Format:** JSON (`Content-Type: application/json`)
- **Versi:** `v1`
- **Autentikasi:** `Authorization: Bearer <accessToken>` untuk endpoint bertanda Bearer.
- **Zona waktu default:** `Asia/Jakarta` (dapat dioverride dengan `timezone`).

---

## 1. Response Envelope

### Sukses — satu resource

```json
{
  "data": {
    "id": "cm...",
    "name": "Michael"
  }
}
```

### Sukses — daftar resource

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid",
    "details": [
      {
        "path": "email",
        "message": "Format email tidak valid",
        "code": "invalid_format"
      }
    ]
  }
}
```

`details` bersifat opsional dan dapat berupa array validasi, objek tambahan, atau informasi konteks lain.

---

## 2. Authentication

Access token berumur **15 menit** (default), refresh token **7 hari** (default). Refresh token disimpan di cookie `httpOnly` bernama `refresh_token` dengan path `/api/v1/auth`.

Refresh token **tidak** dikembalikan di body JSON. Frontend browser cukup menggunakan cookie; klien non-browser dapat membaca header `Set-Cookie` dan mengirimkannya kembali secara manual.

### 2.1 POST `/auth/signup`

Mendaftarkan pengguna baru dan langsung login.

**Request**

```json
{
  "name": "Michael",
  "email": "michael@example.com",
  "password": "rahasia123"
}
```

**Validasi**

| Field | Aturan |
| :--- | :--- |
| `name` | 2–80 karakter |
| `email` | Format email valid, maksimal 254 karakter, disimpan lowercase |
| `password` | 8–72 karakter |

**Response `201`**

```json
{
  "data": {
    "user": {
      "id": "cm...",
      "name": "Michael",
      "email": "michael@example.com",
      "createdAt": "2026-11-20T07:00:00.000Z",
      "updatedAt": "2026-11-20T07:00:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-11-20T07:15:00.000Z"
  }
}
```

**Cookie yang diset**

```text
refresh_token=<opaque-jwt>; HttpOnly; Path=/api/v1/auth; SameSite=Lax
```

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `409` | `EMAIL_ALREADY_REGISTERED` | Email sudah dipakai |
| `422` | `VALIDATION_ERROR` | Body tidak valid |

### 2.2 POST `/auth/login`

**Request**

```json
{
  "email": "michael@example.com",
  "password": "rahasia123"
}
```

**Response `200`**

```json
{
  "data": {
    "user": {
      "id": "cm...",
      "name": "Michael",
      "email": "michael@example.com",
      "createdAt": "2026-11-20T07:00:00.000Z",
      "updatedAt": "2026-11-20T07:00:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-11-20T07:15:00.000Z"
  }
}
```

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `401` | `INVALID_CREDENTIALS` | Email atau password salah |
| `422` | `VALIDATION_ERROR` | Body tidak valid |

### 2.3 POST `/auth/refresh`

Membaca refresh token dari cookie. Body opsional untuk klien non-browser.

**Request (opsional)**

```json
{
  "refreshToken": "token-dari-set-cookie"
}
```

**Response `200`**

```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-11-20T07:30:00.000Z"
  }
}
```

Refresh token lama direvoke dan diganti dengan yang baru melalui `Set-Cookie`.

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `401` | `REFRESH_TOKEN_MISSING` | Cookie/body tidak berisi refresh token |
| `401` | `INVALID_REFRESH_TOKEN` | Token tidak valid, sudah direvoke, atau tidak dikenal |
| `401` | `REFRESH_TOKEN_EXPIRED` | Token kedaluwarsa |

### 2.4 POST `/auth/logout`

Merevoke refresh token (jika ada) dan menghapus cookie. Tidak memerlukan access token.

**Request (opsional)**

```json
{
  "refreshToken": "token-dari-set-cookie"
}
```

**Response `200`**

```json
{
  "data": {
    "loggedOut": true
  }
}
```

### 2.5 Menggunakan access token

```http
GET /api/v1/tasks HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGciOi...
```

Jika access token kedaluwarsa, server membalas `401` dengan code `ACCESS_TOKEN_EXPIRED`. Frontend harus memanggil `/auth/refresh`, lalu mengulang request sekali.

---

## 3. Users

Semua endpoint users memerlukan Bearer access token.

### 3.1 GET `/users/me`

**Response `200`**

```json
{
  "data": {
    "id": "cm...",
    "name": "Michael",
    "email": "michael@example.com",
    "createdAt": "2026-11-20T07:00:00.000Z",
    "updatedAt": "2026-11-20T07:00:00.000Z"
  }
}
```

### 3.2 PATCH `/users/me`

Update nama dan/atau email. Minimal satu field harus diisi.

**Request**

```json
{
  "name": "Michael Tan",
  "email": "michael.tan@example.com"
}
```

**Response `200`**

```json
{
  "data": {
    "id": "cm...",
    "name": "Michael Tan",
    "email": "michael.tan@example.com",
    "createdAt": "2026-11-20T07:00:00.000Z",
    "updatedAt": "2026-11-20T08:00:00.000Z"
  }
}
```

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `409` | `EMAIL_ALREADY_REGISTERED` | Email baru sudah dipakai |
| `422` | `VALIDATION_ERROR` | Body tidak valid |

### 3.3 PATCH `/users/me/password`

Mengganti password. Seluruh refresh token pengguna direvoke dan pasangan token baru diterbitkan.

**Request**

```json
{
  "currentPassword": "rahasia123",
  "newPassword": "rahasia456"
}
```

**Response `200`**

```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-11-20T08:15:00.000Z"
  }
}
```

Cookie `refresh_token` baru juga diset.

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `400` | `INVALID_CURRENT_PASSWORD` | Password saat ini salah |
| `422` | `VALIDATION_ERROR` | Password baru tidak valid atau sama dengan password lama |

---

## 4. Tasks

### 4.1 Bentuk Task Object

```json
{
  "id": "cm...",
  "title": "Menyelesaikan laporan praktikum",
  "description": "Laporan praktikum selesai dan siap dikumpulkan.",
  "category": "Akademik",
  "estimatedMinutes": 90,
  "priorityScore": 92,
  "priorityLevel": "HIGH",
  "priorityReason": "Deadline besok dan menyangkut penilaian.",
  "deadline": "2026-11-21T16:59:59.999Z",
  "status": "PENDING",
  "source": "BRAIN_DUMP",
  "isCompleted": false,
  "completedAt": null,
  "createdAt": "2026-11-20T07:00:00.000Z",
  "updatedAt": "2026-11-20T07:00:00.000Z",
  "microSteps": [
    {
      "id": "cm...",
      "title": "Buka dokumen laporan dan buat tiga heading utama",
      "description": null,
      "estimatedMinutes": 10,
      "order": 0,
      "isCompleted": false,
      "completedAt": null
    }
  ],
  "firstMicroStep": {
    "id": "cm...",
    "title": "Buka dokumen laporan dan buat tiga heading utama",
    "description": null,
    "estimatedMinutes": 10,
    "order": 0,
    "isCompleted": false,
    "completedAt": null
  },
  "nextMicroStep": {
    "id": "cm...",
    "title": "Buka dokumen laporan dan buat tiga heading utama",
    "description": null,
    "estimatedMinutes": 10,
    "order": 0,
    "isCompleted": false,
    "completedAt": null
  },
  "progress": {
    "completedSteps": 0,
    "totalSteps": 1,
    "percentage": 0
  }
}
```

Catatan:

- `priorityLevel` selalu diturunkan server dari `priorityScore`:
  - `>= 70` → `HIGH`
  - `40–69` → `MEDIUM`
  - `< 40` → `LOW`
- `source` bernilai `MANUAL` atau `BRAIN_DUMP`.
- `status` bernilai `PENDING`, `IN_PROGRESS`, atau `COMPLETED`.
- `firstMicroStep` adalah step dengan `order` terkecil.
- `nextMicroStep` adalah step pertama yang belum selesai, atau `null`.
- `progress.percentage` dihitung dari jumlah micro-step yang selesai.

### 4.2 GET `/tasks`

**Query parameters**

| Parameter | Tipe | Default | Keterangan |
| :--- | :--- | :--- | :--- |
| `status` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` \| `ALL` | semua | Filter status |
| `priority` | `HIGH` \| `MEDIUM` \| `LOW` | — | Filter level prioritas |
| `category` | string | — | Filter kategori (case-insensitive) |
| `search` | string | — | Cari di judul/deskripsi |
| `date` | `YYYY-MM-DD` | — | Deadline pada tanggal tersebut, atau tugas tanpa deadline yang dibuat pada tanggal tersebut |
| `timezone` | IANA timezone | `Asia/Jakarta` | Dipakai untuk interpretasi `date` |
| `deadlineFrom` | ISO 8601 | — | Batas bawah deadline |
| `deadlineTo` | ISO 8601 | — | Batas atas deadline |
| `sort` | `priority` \| `deadline` \| `createdAt` \| `estimatedMinutes` | `priority` | Urutan |
| `order` | `asc` \| `desc` | `desc` | Arah urutan |
| `page` | integer ≥ 1 | `1` | Halaman |
| `limit` | integer 1–100 | `20` | Jumlah per halaman |

`deadlineFrom` dan `deadlineTo` menerima ISO 8601 lengkap atau tanggal saja (`YYYY-MM-DD`). Untuk tanggal saja, `deadlineFrom` dimulai dari awal hari dan `deadlineTo` berakhir di akhir hari (`APP_TIMEZONE`).

Contoh:

```http
GET /api/v1/tasks?status=PENDING&priority=HIGH&date=2026-11-20&timezone=Asia/Jakarta&sort=deadline&order=asc
Authorization: Bearer eyJhbGciOi...
```

**Response `200`**

```json
{
  "data": [
    {
      "id": "cm...",
      "title": "Menyelesaikan laporan praktikum",
      "priorityLevel": "HIGH",
      "status": "PENDING",
      "microSteps": [],
      "progress": {
        "completedSteps": 0,
        "totalSteps": 0,
        "percentage": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

> Contoh di atas dipotong; setiap item tetap mengikuti bentuk Task Object lengkap.

### 4.3 POST `/tasks`

Membuat tugas manual.

**Request**

```json
{
  "title": "Belajar SQL JOIN",
  "description": "Menguasai JOIN untuk kuis database.",
  "category": "Akademik",
  "estimatedMinutes": 60,
  "priorityScore": 65,
  "priorityReason": "Kuis Jumat dan materi belum dikuasai.",
  "deadline": "2026-11-21T16:59:59.999Z",
  "microSteps": [
    {
      "title": "Baca ulang materi SQL JOIN",
      "estimatedMinutes": 10
    },
    {
      "title": "Kerjakan 5 latihan JOIN",
      "estimatedMinutes": 15
    }
  ]
}
```

**Aturan field**

| Field | Wajib | Aturan |
| :--- | :---: | :--- |
| `title` | Ya | 1–200 karakter |
| `description` | Tidak | Maksimal 2000 karakter |
| `category` | Tidak | Maksimal 60 karakter |
| `estimatedMinutes` | Ya | 5–1440 menit |
| `priorityScore` | Tidak | 0–100, default 50 |
| `priorityReason` | Tidak | Maksimal 500 karakter |
| `deadline` | Tidak | ISO 8601 atau `null` |
| `microSteps` | Tidak | Maksimal 10 item; `estimatedMinutes` tiap step 5–15 |
| `microSteps[].order` | Tidak | Integer ≥ 0; jika kosong mengikuti urutan array |

`priorityLevel` tidak dikirim; server menghitungnya dari `priorityScore`.

**Response `201`** — Task Object lengkap.

### 4.4 GET `/tasks/:id`

**Response `200`** — Task Object lengkap.

**Error**

| Status | Code |
| :--- | :--- |
| `404` | `TASK_NOT_FOUND` |

### 4.5 PATCH `/tasks/:id`

Update sebagian field. Minimal satu field harus diisi.

**Request**

```json
{
  "title": "Belajar SQL JOIN dan Subquery",
  "priorityScore": 80,
  "deadline": null
}
```

- `priorityScore` baru akan menghitung ulang `priorityLevel`.
- `deadline: null` menghapus deadline.
- Field yang tidak dikirim tidak berubah.

**Response `200`** — Task Object lengkap.

### 4.6 DELETE `/tasks/:id`

**Response `204`** — tanpa body.

Menghapus tugas beserta micro-step dan sesi fokus terkait (cascade).

### 4.7 PATCH `/tasks/:id/complete`

Menandai tugas selesai. Idempotent: jika sudah selesai, response tetap `200`.

**Response `200`** — Task Object dengan `status: "COMPLETED"` dan `completedAt` terisi.

Micro-step tidak otomatis ditandai selesai.

### 4.8 PATCH `/tasks/:id/reopen`

Membuka kembali tugas yang sudah selesai.

- Jika ada micro-step yang sudah selesai → status menjadi `IN_PROGRESS`.
- Jika tidak ada → status menjadi `PENDING`.
- `completedAt` menjadi `null`.

**Response `200`** — Task Object.

### 4.9 POST `/tasks/:id/steps`

Menambah micro-step.

**Request**

```json
{
  "title": "Cek kembali format sitasi",
  "description": "Opsional",
  "estimatedMinutes": 10,
  "order": 3
}
```

- `order` opsional; jika kosong diletakkan setelah step terakhir.
- `estimatedMinutes` wajib 5–15.

**Response `201`** — Task Object lengkap yang sudah diperbarui.

### 4.10 PATCH `/tasks/:id/steps/:stepId`

Update micro-step.

**Request (contoh)**

```json
{
  "title": "Cek format sitasi dan daftar pustaka",
  "estimatedMinutes": 15
}
```

Minimal satu field. **Response `200`** — Task Object lengkap.

### 4.11 DELETE `/tasks/:id/steps/:stepId`

**Response `200`** — Task Object lengkap yang sudah diperbarui.

### 4.12 PATCH `/tasks/:id/steps/:stepId/complete`

Menandai micro-step selesai.

- Jika tugas masih `PENDING`, status tugas berubah menjadi `IN_PROGRESS`.
- Jika tugas sudah `COMPLETED`, status tugas tidak berubah.

**Response `200`** — Task Object lengkap.

### 4.13 PATCH `/tasks/:id/steps/:stepId/reopen`

Membuka kembali micro-step.

- Jika tugas sedang `COMPLETED`, tugas dibuka kembali menjadi `IN_PROGRESS` dan `completedAt` dikosongkan.

**Response `200`** — Task Object lengkap.

---

## 5. Brain Dump

### 5.1 POST `/brain-dump`

Mengirim teks bebas. AI mengekstrak tugas, memprioritaskan, dan memecahnya menjadi micro-step. Tugas langsung disimpan ke database.

**Rate limit:** 30 request per jam per pengguna terautentikasi (fallback ke IP jika identitas pengguna tidak tersedia).

**Request**

```json
{
  "text": "Saya harus mengerjakan laporan praktikum yang dikumpulkan besok, belajar untuk kuis database hari Jumat, dan menyelesaikan project machine learning minggu depan.",
  "timezone": "Asia/Jakarta"
}
```

| Field | Wajib | Aturan |
| :--- | :---: | :--- |
| `text` | Ya | 10–5000 karakter |
| `timezone` | Tidak | IANA timezone, default `APP_TIMEZONE` |

**Response `201`**

```json
{
  "data": [
    {
      "id": "cm...",
      "title": "Menyelesaikan laporan praktikum",
      "description": "Laporan praktikum selesai dan siap dikumpulkan.",
      "category": "Akademik",
      "estimatedMinutes": 90,
      "priorityScore": 92,
      "priorityLevel": "HIGH",
      "priorityReason": "Deadline besok dan menyangkut penilaian.",
      "deadline": "2026-11-21T16:59:59.999Z",
      "status": "PENDING",
      "source": "BRAIN_DUMP",
      "isCompleted": false,
      "completedAt": null,
      "createdAt": "2026-11-20T07:00:00.000Z",
      "updatedAt": "2026-11-20T07:00:00.000Z",
      "microSteps": [
        {
          "id": "cm...",
          "title": "Buka dokumen laporan dan buat tiga heading utama",
          "description": null,
          "estimatedMinutes": 10,
          "order": 0,
          "isCompleted": false,
          "completedAt": null
        }
      ],
      "firstMicroStep": {
        "id": "cm...",
        "title": "Buka dokumen laporan dan buat tiga heading utama",
        "description": null,
        "estimatedMinutes": 10,
        "order": 0,
        "isCompleted": false,
        "completedAt": null
      },
      "nextMicroStep": {
        "id": "cm...",
        "title": "Buka dokumen laporan dan buat tiga heading utama",
        "description": null,
        "estimatedMinutes": 10,
        "order": 0,
        "isCompleted": false,
        "completedAt": null
      },
      "progress": {
        "completedSteps": 0,
        "totalSteps": 1,
        "percentage": 0
      }
    }
  ],
  "meta": {
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "taskCount": 1,
    "timezone": "Asia/Jakarta",
    "attempts": 1,
    "generatedAt": "2026-11-20T07:00:00.000Z"
  }
}
```

### 5.2 Kontrak JSON AI

Server meminta AI mengembalikan bentuk berikut:

```json
{
  "tasks": [
    {
      "title": "Menyelesaikan laporan praktikum",
      "description": "Laporan praktikum selesai dan siap dikumpulkan.",
      "category": "Akademik",
      "estimatedMinutes": 90,
      "priorityScore": 92,
      "priorityLevel": "HIGH",
      "priorityReason": "Deadline besok dan menyangkut penilaian.",
      "deadline": "2026-11-21T23:59:59+07:00",
      "firstMicroStep": {
        "title": "Buka dokumen laporan dan buat tiga heading utama",
        "estimatedMinutes": 10
      },
      "additionalSteps": [
        {
          "title": "Tulis bagian pendahuluan dan tujuan praktikum",
          "estimatedMinutes": 15
        }
      ]
    }
  ]
}
```

Aturan yang diterapkan server:

- Maksimal 10 tugas; kelebihan dipotong.
- `estimatedMinutes` tugas dinormalisasi ke 5–1440.
- `estimatedMinutes` micro-step dinormalisasi ke 5–15.
- `priorityScore` dinormalisasi ke 0–100.
- `priorityLevel` dari AI diabaikan dan dihitung ulang dari skor.
- `additionalSteps` maksimal 8; kelebihan dipotong.
- Jika JSON/skema tidak valid, server melakukan **satu kali percobaan perbaikan** dengan prompt repair.
- `meta.attempts` bernilai `1` atau `2`.

### 5.3 Provider AI

| `AI_PROVIDER` | Perilaku |
| :--- | :--- |
| `gemini` | Memanggil Gemini API. Wajib `GEMINI_API_KEY`. |
| `mock` | Menghasilkan tugas dummy dari baris input. Tidak memanggil API eksternal. |

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `503` | `AI_NOT_CONFIGURED` | `AI_PROVIDER=gemini` tetapi API key kosong |
| `502` | `AI_UPSTREAM_ERROR` | Gemini mengembalikan error |
| `504` | `AI_TIMEOUT` | Request AI melebihi `AI_TIMEOUT_MS` |
| `502` | `AI_INVALID_RESPONSE` | Respons AI tetap tidak valid setelah repair |
| `502` | `AI_BLOCKED` | Input diblokir kebijakan keamanan Gemini |
| `502` | `AI_EMPTY_RESPONSE` | Gemini tidak mengembalikan teks |
| `429` | `RATE_LIMITED` | Melebihi 30 request/jam |

---

## 6. Overview

### 6.1 GET `/overview`

**Query parameters**

| Parameter | Tipe | Default | Keterangan |
| :--- | :--- | :--- | :--- |
| `date` | `YYYY-MM-DD` | hari ini | Tanggal ringkasan |
| `timezone` | IANA timezone | `Asia/Jakarta` | Zona waktu perhitungan hari |

**Response `200`**

```json
{
  "data": {
    "date": "2026-11-20",
    "timezone": "Asia/Jakarta",
    "tasks": {
      "active": 3,
      "completedToday": 2,
      "overdue": 1,
      "totalToday": 5
    },
    "workload": {
      "totalMinutes": 330,
      "activeMinutes": 210,
      "completedMinutes": 120,
      "remainingMinutes": 210,
      "totalLabel": "5 jam 30 menit",
      "activeLabel": "3 jam 30 menit",
      "completedLabel": "2 jam",
      "remainingLabel": "3 jam 30 menit"
    },
    "completionPercentage": 40,
    "recommendedTask": {
      "id": "cm...",
      "title": "Menyelesaikan laporan praktikum",
      "priorityScore": 92,
      "priorityLevel": "HIGH",
      "status": "PENDING",
      "microSteps": []
    },
    "botanical": {
      "stage": "seedling",
      "label": "Bibit Tumbuh",
      "growthPercentage": 40,
      "description": "Bibit tumbuh sehat. Jaga ritme kecilmu.",
      "asset": "/assets/botanical/seedling.svg"
    }
  }
}
```

Definisi:

- `tasks.active`: seluruh tugas berstatus `PENDING` atau `IN_PROGRESS`.
- `tasks.completedToday`: tugas `COMPLETED` dengan `completedAt` di dalam rentang tanggal.
- `tasks.totalToday`: `active + completedToday`.
- `tasks.overdue`: tugas aktif dengan deadline sebelum sekarang.
- `workload.totalMinutes`: estimasi tugas aktif + tugas selesai hari ini.
- `workload.remainingMinutes`: estimasi tugas aktif.
- `completionPercentage`: `completedToday / totalToday × 100`, dibulatkan.
- `recommendedTask`: tugas aktif dengan skor prioritas tertinggi; jika seri, deadline terdekat; jika masih seri, yang paling lama dibuat. Bernilai `null` jika tidak ada tugas aktif.

### 6.2 Tahap Botanikal

| Persentase | `stage` | Label | Asset |
| :--- | :--- | :--- | :--- |
| `0` | `seed` | Bibit Tertidur | `/assets/botanical/seed.svg` |
| `1–25` | `sprout` | Tunas Kecil | `/assets/botanical/sprout.svg` |
| `26–50` | `seedling` | Bibit Tumbuh | `/assets/botanical/seedling.svg` |
| `51–75` | `sapling` | Pohon Muda | `/assets/botanical/sapling.svg` |
| `76–99` | `blooming` | Mulai Berbunga | `/assets/botanical/blooming.svg` |
| `100` | `full_bloom` | Pohon Rimbun | `/assets/botanical/full_bloom.svg` |

`asset` adalah path yang disarankan untuk frontend. File aset belum disertakan di backend.

---

## 7. Focus Sessions

### 7.1 Bentuk Focus Session Object

```json
{
  "id": "cm...",
  "durationMinutes": 10,
  "status": "ACTIVE",
  "motivationalMessage": "Satu langkah kecil hari ini lebih baik daripada rencana besar yang terus ditunda.",
  "startedAt": "2026-11-20T07:00:00.000Z",
  "endsAt": "2026-11-20T07:10:00.000Z",
  "endedAt": null,
  "createdAt": "2026-11-20T07:00:00.000Z",
  "updatedAt": "2026-11-20T07:00:00.000Z",
  "task": {
    "id": "cm...",
    "title": "Menyelesaikan laporan praktikum"
  },
  "microStep": {
    "id": "cm...",
    "title": "Buka dokumen laporan dan buat tiga heading utama",
    "estimatedMinutes": 10,
    "isCompleted": false,
    "order": 0
  }
}
```

`status` bernilai `ACTIVE`, `COMPLETED`, atau `CANCELLED`. `endsAt` adalah perkiraan waktu selesai berdasarkan `startedAt + durationMinutes`.

### 7.2 POST `/focus-sessions`

**Request**

```json
{
  "taskId": "cm...",
  "microStepId": "cm...",
  "durationMinutes": 10
}
```

| Field | Wajib | Aturan |
| :--- | :---: | :--- |
| `taskId` | Ya | ID tugas milik pengguna |
| `microStepId` | Tidak | Jika kosong, server memilih micro-step pertama yang belum selesai |
| `durationMinutes` | Ya | 5–15 menit |

Perilaku:

- Tugas harus milik pengguna dan belum `COMPLETED`.
- Micro-step yang dipilih harus milik tugas tersebut dan belum selesai.
- Jika pengguna masih memiliki sesi `ACTIVE`, request ditolak `409`.
- Status tugas `PENDING` otomatis berubah menjadi `IN_PROGRESS`.
- Pesan motivasi dipilih acak dan disimpan pada sesi.

**Response `201`** — Focus Session Object.

**Error**

| Status | Code | Penyebab |
| :--- | :--- | :--- |
| `404` | `TASK_NOT_FOUND` | Tugas tidak ditemukan |
| `404` | `MICRO_STEP_NOT_FOUND` | Micro-step tidak ditemukan pada tugas |
| `409` | `TASK_ALREADY_COMPLETED` | Tugas sudah selesai |
| `409` | `MICRO_STEP_ALREADY_COMPLETED` | Micro-step sudah selesai |
| `409` | `ACTIVE_FOCUS_SESSION_EXISTS` | Masih ada sesi aktif |

`ACTIVE_FOCUS_SESSION_EXISTS` menyertakan detail:

```json
{
  "error": {
    "code": "ACTIVE_FOCUS_SESSION_EXISTS",
    "message": "Masih ada sesi fokus yang aktif. Selesaikan atau batalkan sesi tersebut terlebih dahulu.",
    "details": {
      "activeSession": {
        "id": "cm...",
        "status": "ACTIVE"
      }
    }
  }
}
```

### 7.3 GET `/focus-sessions`

**Query parameters**

| Parameter | Tipe | Default | Keterangan |
| :--- | :--- | :--- | :--- |
| `status` | `ACTIVE` \| `COMPLETED` \| `CANCELLED` \| `ALL` | semua | Filter status |
| `from` | ISO 8601 | — | Batas bawah `startedAt` |
| `to` | ISO 8601 | — | Batas atas `startedAt` |
| `page` | integer ≥ 1 | `1` | Halaman |
| `limit` | integer 1–100 | `20` | Jumlah per halaman |

`from` dan `to` menerima ISO 8601 lengkap atau tanggal saja. Untuk tanggal saja, `from` dimulai dari awal hari dan `to` berakhir di akhir hari (`APP_TIMEZONE`).

**Response `200`** — array Focus Session Object + meta pagination, diurutkan `startedAt` terbaru.

### 7.4 GET `/focus-sessions/active`

**Response `200`**

```json
{
  "data": {
    "id": "cm...",
    "status": "ACTIVE"
  }
}
```

Jika tidak ada sesi aktif:

```json
{
  "data": null
}
```

### 7.5 GET `/focus-sessions/:id`

**Response `200`** — Focus Session Object.

### 7.6 PATCH `/focus-sessions/:id/complete`

**Request (opsional)**

```json
{
  "completeMicroStep": true
}
```

- `completeMicroStep` default `false`.
- Jika `true` dan sesi memiliki micro-step, micro-step ditandai selesai.
- Tugas yang masih `PENDING` berubah menjadi `IN_PROGRESS`.

**Response `200`** — Focus Session Object dengan `status: "COMPLETED"`.

**Error**

| Status | Code |
| :--- | :--- |
| `404` | `FOCUS_SESSION_NOT_FOUND` |
| `409` | `INVALID_FOCUS_SESSION_STATUS` |

### 7.7 PATCH `/focus-sessions/:id/cancel`

Membatalkan sesi `ACTIVE`. Micro-step tidak diubah.

**Response `200`** — Focus Session Object dengan `status: "CANCELLED"`.

---

## 8. Health

| Method | Path | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/health` | Status server |
| `GET` | `/health/db` | Cek koneksi database |
| `GET` | `/api/v1/health` | Alias di bawah prefix API |
| `GET` | `/api/v1/health/db` | Alias di bawah prefix API |

Contoh `/health`:

```json
{
  "status": "ok",
  "service": "productivity-assistant-backend",
  "timestamp": "2026-11-20T07:00:00.000Z",
  "uptimeSeconds": 120
}
```

Contoh `/health/db`:

```json
{
  "status": "ok",
  "database": "reachable"
}
```

Jika database tidak dapat diakses, `/health/db` membalas `503`:

```json
{
  "status": "error",
  "database": "unreachable"
}
```

---

## 9. Error Codes

| HTTP | Code | Keterangan |
| :---: | :--- | :--- |
| `400` | `INVALID_JSON` | Body bukan JSON valid |
| `400` | `INVALID_DATE` | Format tanggal salah |
| `400` | `INVALID_TIMEZONE` | Timezone IANA tidak valid |
| `400` | `INVALID_CURRENT_PASSWORD` | Password saat ini salah |
| `401` | `UNAUTHORIZED` | Bearer token tidak ada/tidak valid |
| `401` | `ACCESS_TOKEN_EXPIRED` | Access token kedaluwarsa |
| `401` | `INVALID_ACCESS_TOKEN` | Access token tidak valid |
| `401` | `INVALID_CREDENTIALS` | Email/password salah |
| `401` | `REFRESH_TOKEN_MISSING` | Refresh token tidak dikirim |
| `401` | `INVALID_REFRESH_TOKEN` | Refresh token tidak valid/direvoke |
| `401` | `REFRESH_TOKEN_EXPIRED` | Refresh token kedaluwarsa |
| `403` | `CORS_ORIGIN_NOT_ALLOWED` | Origin frontend tidak diizinkan |
| `404` | `ROUTE_NOT_FOUND` | Endpoint tidak ada |
| `404` | `USER_NOT_FOUND` | Pengguna tidak ditemukan |
| `404` | `TASK_NOT_FOUND` | Tugas tidak ditemukan |
| `404` | `MICRO_STEP_NOT_FOUND` | Micro-step tidak ditemukan |
| `404` | `FOCUS_SESSION_NOT_FOUND` | Sesi fokus tidak ditemukan |
| `409` | `EMAIL_ALREADY_REGISTERED` | Email sudah terdaftar |
| `409` | `TASK_ALREADY_COMPLETED` | Tugas sudah selesai |
| `409` | `MICRO_STEP_ALREADY_COMPLETED` | Micro-step sudah selesai |
| `409` | `ACTIVE_FOCUS_SESSION_EXISTS` | Masih ada sesi fokus aktif |
| `409` | `INVALID_FOCUS_SESSION_STATUS` | Status sesi tidak mendukung operasi |
| `409` | `UNIQUE_CONSTRAINT_VIOLATION` | Pelanggaran unique constraint database |
| `409` | `FOREIGN_KEY_CONSTRAINT_VIOLATION` | Pelanggaran foreign key |
| `422` | `VALIDATION_ERROR` | Body/query tidak valid |
| `422` | `INVALID_DEADLINE` | Deadline tidak dapat diparse |
| `422` | `INVALID_DATE_FILTER` | Filter tanggal tidak valid |
| `429` | `RATE_LIMITED` | Melebihi rate limit |
| `500` | `INTERNAL_SERVER_ERROR` | Error server tak terduga |
| `502` | `AI_UPSTREAM_ERROR` | Error dari Gemini |
| `502` | `AI_INVALID_RESPONSE` | Respons AI tidak valid |
| `502` | `AI_BLOCKED` | Input diblokir Gemini |
| `502` | `AI_EMPTY_RESPONSE` | Gemini tidak mengembalikan konten |
| `503` | `AI_NOT_CONFIGURED` | API key Gemini belum diisi |
| `503` | `DATABASE_UNAVAILABLE` | Database tidak dapat diakses |
| `504` | `AI_TIMEOUT` | Request AI timeout |

---

## 10. Rate Limits

| Endpoint | Batas |
| :--- | :--- |
| `POST /auth/signup` | 30 request / 15 menit / IP |
| `POST /auth/login` | 30 request / 15 menit / IP |
| `POST /auth/refresh` | 120 request / 15 menit / IP |
| `POST /brain-dump` | 30 request / jam / pengguna (fallback IP) |

Rate limit mengembalikan `429`:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Terlalu banyak percobaan autentikasi. Coba lagi dalam 15 menit."
  }
}
```

---

## 11. Frontend Integration Notes

### 11.1 Fetch dengan cookie

Untuk endpoint auth (`signup`, `login`, `refresh`, `logout`), sertakan credentials:

```ts
await fetch("http://localhost:4000/api/v1/auth/refresh", {
  method: "POST",
  credentials: "include",
});
```

`CORS_ORIGIN` di backend harus memuat origin frontend. Contoh:

```env
CORS_ORIGIN=http://localhost:3000,https://frontend-anda.vercel.app
```

### 11.2 Menyimpan access token

Simpan access token di memory (bukan `localStorage`) dan kirim sebagai Bearer:

```ts
await fetch("http://localhost:4000/api/v1/tasks", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### 11.3 Refresh otomatis

Alur yang disarankan:

1. Request bisnis gagal `401` dengan code `ACCESS_TOKEN_EXPIRED`.
2. Panggil `/auth/refresh` dengan `credentials: "include"`.
3. Simpan access token baru.
4. Ulangi request bisnis satu kali.
5. Jika refresh gagal, arahkan pengguna ke halaman login.

### 11.4 Timezone

- Kirim `timezone` pada request brain dump, overview, dan daftar tugas agar tanggal relatif dihitung benar.
- Deadline disimpan dan dikembalikan dalam ISO 8601 UTC. Frontend sebaiknya menampilkan dalam timezone pengguna.
- Jika `deadline` hanya berisi tanggal (`YYYY-MM-DD`), server menafsirkannya sebagai akhir hari di `APP_TIMEZONE` (default `Asia/Jakarta`).

### 11.5 CORS dan cookie production

- Frontend dan backend di site yang sama: `COOKIE_SAMESITE=lax`.
- Frontend dan backend di site berbeda (misal Vercel + domain API terpisah): `COOKIE_SAMESITE=none` dan `COOKIE_SECURE=true`.
- `COOKIE_DOMAIN` hanya diisi jika cookie perlu dibagikan antar-subdomain.

### 11.6 Contoh alur Brain Dump

```ts
const response = await fetch("http://localhost:4000/api/v1/brain-dump", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    text: "Laporan praktikum besok, kuis database Jumat, project ML minggu depan",
    timezone: "Asia/Jakarta",
  }),
});

const { data: tasks, meta } = await response.json();
```

`data` langsung berisi tugas yang sudah tersimpan, lengkap dengan micro-step pertama.
