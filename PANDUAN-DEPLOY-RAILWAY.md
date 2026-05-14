# Panduan Deploy SAFIRA di Railway

## Arsitektur di Railway

```
Railway Project: SAFIRA
├── Service: backend        → Node.js API (port 5000)
├── Service: frontend       → React Static Site
└── Service: PostgreSQL     → Database (disediakan Railway)
```

Frontend dan backend di-deploy sebagai **service terpisah**. Railway menyediakan URL publik untuk masing-masing service.

---

## Prasyarat

- Akun Railway berbayar (sudah ada)
- [Railway CLI](https://docs.railway.app/develop/cli) terinstall (opsional, bisa pakai dashboard)
- Project sudah di GitHub (sangat direkomendasikan untuk auto-deploy)
- Git terinstall di komputer

---

## Langkah 0: Push Project ke GitHub

Jika belum ada di GitHub, buat repository baru dan push:

```bash
cd C:\Users\User\Music\E-Surat
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/nama-repo.git
git push -u origin main
```

> Railway akan otomatis re-deploy setiap kali Anda push ke GitHub.

---

## BAGIAN 1: DEPLOY BACKEND

### Langkah 1.1 — Buat Project Baru di Railway

1. Buka [railway.app](https://railway.app) → Login
2. Klik **New Project**
3. Pilih **Deploy from GitHub repo**
4. Pilih repository SAFIRA Anda
5. Railway akan mendeteksi kode dan mulai build

### Langkah 1.2 — Konfigurasi Root Directory Backend

Karena backend ada di subfolder `/backend`:

1. Klik service yang baru dibuat
2. Buka tab **Settings**
3. Di bagian **Source** → **Root Directory** → isi: `backend`
4. Klik **Save**

Railway akan rebuild otomatis dari folder `backend/`.

### Langkah 1.3 — Tambah Database PostgreSQL

1. Di halaman project Railway, klik **+ New**
2. Pilih **Database** → **Add PostgreSQL**
3. Railway akan membuat database dan menambahkan `DATABASE_URL` secara otomatis ke environment

### Langkah 1.4 — Set Environment Variables Backend

Buka service backend → tab **Variables** → tambahkan satu per satu:

| Variable | Nilai |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `JWT_SECRET` | *(string acak panjang, min. 32 karakter — lihat catatan di bawah)* |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | *(isi setelah frontend di-deploy — lihat Langkah 2.4)* |
| `UPLOAD_DIR` | `uploads` |
| `MAX_FILE_SIZE` | `10485760` |
| `VAPID_PUBLIC_KEY` | `BHL7VIyoOy9PM4ReatA65FgVL9Dri7uxZsp6fRfO9D8wJYxKfzoq1zVXw4k_h3k_lDy4KIyPI6I0ZGdfRFp03YU` |
| `VAPID_PRIVATE_KEY` | `ukt_YKzu0QzXYisasD40xfvMkl52c6S0-R_2_rwFD5Y` |
| `VAPID_EMAIL` | `mailto:admin@safira.com` |

> **`DATABASE_URL`** sudah otomatis terisi oleh Railway saat Anda menambahkan PostgreSQL. Tidak perlu diisi manual.

**Cara generate JWT_SECRET yang aman:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Jalankan perintah ini di terminal, lalu copy hasilnya.

### Langkah 1.5 — Verifikasi railway.json

File `backend/railway.json` sudah ada dan sudah benar:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node src/server.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Perintah `npx prisma migrate deploy` akan otomatis menjalankan migrasi database setiap deploy.

### Langkah 1.6 — Jalankan Seed Data (Akun Default)

Setelah backend berhasil deploy dan berjalan:

1. Buka service backend → tab **Settings** → scroll ke **Deploy**
2. Klik **Deploy** → atau gunakan Railway CLI:

```bash
# Install Railway CLI jika belum ada
npm install -g @railway/cli

# Login
railway login

# Masuk ke project
railway link

# Jalankan seed sekali saja
railway run --service backend node prisma/seed.js
```

Atau lewat tab **Deploy** → klik tombol **Run Command** → ketik:
```
node prisma/seed.js
```

### Langkah 1.7 — Dapatkan URL Backend

1. Buka service backend → tab **Settings** → bagian **Networking**
2. Klik **Generate Domain** (jika belum ada)
3. Catat URL-nya, contoh: `https://safira-backend-production.up.railway.app`

Cek backend berjalan dengan buka URL tersebut + `/api/health`:
```
https://safira-backend-production.up.railway.app/api/health
```
Harus muncul: `{"success":true,"message":"SAFIRA API berjalan dengan baik",...}`

---

## BAGIAN 2: DEPLOY FRONTEND

### Langkah 2.1 — Buat File Environment Frontend untuk Production

Buat file `frontend/.env.production` di komputer lokal:

```env
VITE_API_URL=https://safira-backend-production.up.railway.app
```

Ganti URL dengan URL backend Railway Anda yang didapat di Langkah 1.7.

Commit dan push file ini:
```bash
git add frontend/.env.production
git commit -m "add production env for frontend"
git push
```

### Langkah 2.2 — Tambah Service Frontend di Railway

1. Di halaman project Railway yang sama, klik **+ New** → **GitHub Repo**
2. Pilih repository yang sama
3. Beri nama service: `frontend`

### Langkah 2.3 — Konfigurasi Frontend Service

Buka service frontend → tab **Settings**:

**Source:**
- **Root Directory:** `frontend`

**Build:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** *(kosongkan — Railway akan serve static otomatis)*

Atau jika Railway tidak mendeteksi sebagai static site, gunakan serve:
- **Start Command:** `npx serve dist -p $PORT`

**Environment Variables** (tab Variables):

| Variable | Nilai |
|----------|-------|
| `VITE_API_URL` | URL backend Railway (dari Langkah 1.7) |

### Langkah 2.4 — Update FRONTEND_URL di Backend

Setelah frontend berhasil deploy dan mendapat URL:

1. Catat URL frontend, contoh: `https://safira-frontend-production.up.railway.app`
2. Buka service **backend** → tab **Variables**
3. Update nilai `FRONTEND_URL` dengan URL frontend tersebut
4. Backend akan otomatis restart

---

## BAGIAN 3: CATATAN PENTING

### ⚠️ Masalah File Upload di Railway

Railway menggunakan **ephemeral filesystem** — file yang diupload (foto profil, surat masuk, logo) **akan hilang** setiap kali service di-restart atau re-deploy.

**Solusi yang direkomendasikan: Cloudinary atau AWS S3**

Untuk sementara (development/testing), file upload masih berfungsi tapi tidak persisten. Untuk production serius, perlu migrasi storage ke cloud storage.

Alternatif cepat: gunakan **Railway Volume** (fitur berbayar):
1. Buka service backend → tab **Volumes**
2. Klik **Add Volume**
3. Mount path: `/app/uploads`
4. Ini akan membuat storage persisten

### ⚠️ HTTPS Wajib untuk PWA & Push Notification

Railway otomatis menyediakan HTTPS untuk semua service. Tidak perlu konfigurasi SSL manual.

### Custom Domain (Opsional)

Jika ingin menggunakan domain sendiri (misal `safira.organisasi.com`):

1. Buka service → **Settings** → **Networking** → **Custom Domain**
2. Masukkan domain Anda
3. Railway akan menampilkan CNAME record yang perlu ditambahkan di DNS domain Anda
4. Tambahkan CNAME record tersebut di panel DNS domain Anda
5. Tunggu propagasi DNS (5–30 menit)

---

## BAGIAN 4: CHECKLIST DEPLOY

### Backend
- [ ] Service backend terbuat dengan root directory `backend`
- [ ] PostgreSQL service ditambahkan
- [ ] Semua environment variables terisi
- [ ] `railway.json` ada di folder `backend/`
- [ ] Build berhasil (cek tab **Deployments**)
- [ ] `/api/health` mengembalikan response sukses
- [ ] Seed data dijalankan (akun admin tersedia)

### Frontend
- [ ] File `frontend/.env.production` berisi URL backend yang benar
- [ ] Service frontend terbuat dengan root directory `frontend`
- [ ] Build berhasil
- [ ] Halaman login terbuka di URL frontend
- [ ] `FRONTEND_URL` di backend sudah diupdate ke URL frontend

### Fungsionalitas
- [ ] Login dengan `admin@safira.com` / `admin123` berhasil
- [ ] Buat surat keluar dan download PDF berfungsi
- [ ] Upload file surat masuk berfungsi
- [ ] Push notification muncul (butuh HTTPS — sudah otomatis di Railway)
- [ ] PWA bisa diinstall dari browser smartphone

---

## BAGIAN 5: UPDATE KODE SETELAH DEPLOY

Karena terhubung ke GitHub, update sangat mudah:

```bash
# Edit kode di lokal
# ...

# Push ke GitHub
git add .
git commit -m "deskripsi perubahan"
git push
```

Railway akan otomatis mendeteksi push dan mulai re-deploy. Anda bisa memantau progress di tab **Deployments** di Railway dashboard.

---

## BAGIAN 6: MONITORING & TROUBLESHOOTING

### Melihat Log

Di Railway dashboard → klik service → tab **Logs**

Atau via CLI:
```bash
railway logs --service backend
railway logs --service frontend
```

### Restart Service

Di Railway dashboard → klik service → tab **Settings** → **Restart**

### Masalah Umum

**Build gagal karena Prisma:**
Pastikan `DATABASE_URL` sudah terisi sebelum build. Railway harus bisa connect ke database saat `prisma generate` dijalankan.

**CORS error di browser:**
Pastikan `FRONTEND_URL` di backend sudah diisi dengan URL frontend yang benar (termasuk `https://`).

**Push notification tidak berfungsi:**
Pastikan `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, dan `VAPID_EMAIL` sudah terisi di environment variables backend.

**Database belum ada tabelnya:**
Jalankan ulang migrasi via Railway CLI:
```bash
railway run --service backend npx prisma migrate deploy
```

---

*Panduan Deploy Railway — SAFIRA v1.0.0*
