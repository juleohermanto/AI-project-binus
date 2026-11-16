# Product Overview & Spesifikasi Aplikasi

## 1. Overview Aplikasi & Konsep Gabungan

**Identitas Produk:** Asisten produktivitas harian berbasis AI untuk mahasiswa yang mengubah rasa kewalahan (*overwhelm*) akibat tumpukan tugas menjadi langkah kerja kecil yang tenang, terukur, dan mudah langsung dimulai.

* **Mesin Fungsional (dari Super Productivity):** Fokus pada eksekusi tugas harian pribadi (*Today's List*), estimasi durasi waktu (*timeboxing*), ringkasan beban kerja harian (*Daily Overview*), dan sesi fokus berbatas waktu (*Focus Timer*).
* **Otak AI Anti-Procrastination (dari PPT/PDF Tim):** Fitur *AI Brain Dump* yang menerima curhatan tugas berantakan, memberi skor prioritas beserta alasannya, dan memecah tugas besar menjadi **Micro-Step 5–15 menit** agar hambatan psikologis untuk mulai bekerja hilang.
* **Antarmuka Tenang & Gamifikasi Ringan (dari Forest):** Mengganti tampilan tabel kerja yang kaku dengan nuansa hijau alam yang menenangkan dan visual pertumbuhan tanaman—setiap kali pengguna menyelesaikan *micro-step*, tanaman di panel Overview bertumbuh dari bibit menjadi pohon.

### Penjelasan di Dalam Aplikasi (Onboarding / How It Works)

Agar pengguna langsung memahami alur aplikasi saat pertama kali dibuka, halaman utama menampilkan **Kartu Panduan 3 Langkah** (bisa ditutup atau di-*collapse* kapan saja) di bagian atas:

1. **Tumpahkan Pikiran (*Brain Dump*):** Tulis semua tugas, tenggat waktu, atau kepanikanmu dalam bahasa bebas tanpa perlu merapikannya.
2. **Terima Peta Aksi AI:** AI menyusun urutan prioritas, alasan urgensinya, serta satu **Micro-Step (5–15 menit)** paling ringan untuk memulai.
3. **Fokus & Tumbuhkan:** Jalankan *Focus Timer* singkat untuk menyelesaikan *micro-step* tersebut dan lihat progres harianmu bertumbuh.

---

## 2. Fungsi & Fitur Utama (Terukur untuk 3 Minggu)

Seluruh fitur di bawah ini selaras langsung dengan pembagian kartu Sprint 1–3 tanpa menambah beban *backend* yang rumit:

| Fitur Utama | Sumber Konsep | Cara Kerja di Aplikasi |
| :--- | :--- | :--- |
| **1. AI Brain Dump & Auto-Breakdown** | PPT/PDF Tim | Pengguna mengetik curhatan tugas di satu kotak teks. AI otomatis mengekstraknya menjadi kartu tugas berisi judul, kategori, estimasi menit, skor prioritas (`High`/`Medium`/`Low`), penjelasan singkat alasan prioritas, dan 1 *Micro-Step* pertama. |
| **2. Daily Overview & Workload Bar** | Super Productivity + Forest | Panel ringkasan di bagian atas yang menghitung otomatis: jumlah tugas aktif, total estimasi waktu kerja hari ini (misal: *3 Tugas • 2 Jam 5 Menit*), rekomendasi tugas pertama, serta ilustrasi pertumbuhan tanaman berdasarkan persentase tugas yang selesai. |
| **3. Structured Task Cards & Checklist** | Super Productivity | Daftar kartu tugas harian yang bersih. Setiap kartu menonjolkan kotak aksi *Micro-Step* di bagian atas agar mata pengguna langsung tertuju pada langkah paling kecil, lengkap dengan tombol centang selesai dan hapus tugas. |
| **4. Botanical Focus Timer (Timeboxing)** | Super Productivity + Forest | Saat pengguna menekan tombol **"Mulai Micro-Step"** pada salah satu kartu, muncul mode fokus layar penuh/modal yang hanya menampilkan 1 tugas aktif, timer hitung mundur (5–15 menit), teks penyemangat singkat, dan animasi/ilustrasi bibit tanaman yang tumbuh hingga waktu habis. |

---

## 3. Referensi Tampilan Frontend (Patokan UI untuk Madeline & Evan)

Arahan visual berikut menjadi spesifikasi desain untuk divisi UI/UX (`#1`) dan Frontend (`#4`):

### A. Palet Warna & Gaya Visual (Nuansa Forest)

* **Latar Belakang Utama:** Krem hangat / *Off-White* (`#F7F5EE` atau `#FAF9F5`) agar mata tidak cepat lelah dibanding putih terang.
* **Warna Utama (*Primary*):** Hijau hutan lembut / *Sage Forest* (`#3A6B4C` atau `#4A7C59`) untuk tombol aksi utama, ikon tanaman, dan indikator progres.
* **Warna Aksen (*Highlight Micro-Step*):** Hijau pastel muda (`#E8F3EC`) dengan teks hijau tua (`#1F3D2B`) untuk menonjolkan kotak *Micro-Step* pada setiap kartu.
* **Label Prioritas (Lembut, Tidak Mencolok):**
  * **High:** Terakota / Oranye hangat (`#D96B43`)
  * **Medium:** Kuning madu (`#D9A441`)
  * **Low:** Hijau daun muda (`#6B9E78`)
* **Bentuk Komponen:** Sudut kartu membulat lembut (`rounded-2xl`), bayangan tipis (*soft shadow*), tipografi bersih (seperti *Plus Jakarta Sans* atau *Inter*), serta ruang kosong (*whitespace*) yang lega.