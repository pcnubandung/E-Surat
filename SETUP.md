# Panduan Setup SAFIRA

## Prasyarat

- Node.js v18+
- PostgreSQL 14+
- npm atau yarn

---

## 1. Setup Database PostgreSQL

Buat database baru:
```sql
CREATE DATABASE safira_db;
```

---

## 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Salin dan sesuaikan file .env
# Edit DATABASE_URL sesuai konfigurasi PostgreSQL Anda
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Generate Prisma client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init

# Seed data awal (admin default + contoh user)
node prisma/seed.js

# Jalankan server development
npm run dev
```

Backend akan berjalan di: **http://localhost:5000**

---

## 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

---

## 4. Akun Default

Setelah seed, akun berikut tersedia:

| Email | Password | Role |
|-------|----------|------|
| admin@safira.com | admin123 | Admin |
| sekretaris@safira.com | password123 | Sekretaris |
| ketua@safira.com | password123 | Ketua |
| pengurus1@safira.com | password123 | Pengurus |
| pengurus2@safira.com | password123 | Pengurus |

> ⚠️ **Segera ubah password setelah login pertama!**

---

## 5. Konfigurasi .env Backend

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/safira_db"
JWT_SECRET="ganti-dengan-string-acak-yang-panjang"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

---

## 6. Alur Kerja Surat Keluar

1. **Admin** login → Buat Surat Keluar → Pilih penandatangan → Kirim ke Sekretaris
2. **Sekretaris** login → Lihat surat masuk → Tandatangani atau Tolak (dengan catatan)
3. Jika ditolak → Surat kembali ke Admin sebagai Draft → Admin edit & kirim ulang
4. **Ketua** login → Lihat surat → Tandatangani (verifikasi akhir)
5. Surat **SELESAI** → QR Code digenerate → Dapat didownload PDF → Dikirim ke penerima

---

## 7. Struktur Folder Upload

```
backend/uploads/
├── logos/          # Logo organisasi
├── qrcodes/        # QR Code surat
├── surat-masuk/    # File lampiran surat masuk
└── pdf/            # PDF surat (temporary)
```

---

## 8. Build untuk Production

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Output di folder dist/
```
