# 🎉 SAFIRA Berhasil Diinstall!

## ✅ Status Instalasi

- ✅ Node.js v24.15.0 terinstall
- ✅ PostgreSQL 16 terinstall dan berjalan
- ✅ Database `safira_db` dibuat
- ✅ Backend dependencies terinstall
- ✅ Frontend dependencies terinstall
- ✅ Migrasi database selesai
- ✅ Data awal (seed) berhasil
- ✅ Backend berjalan di http://localhost:5000
- ✅ Frontend berjalan di http://localhost:5173

---

## 🚀 Cara Mengakses Aplikasi

### Buka Browser:
```
http://localhost:5173
```

### Login dengan Akun Default:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@safira.com | admin123 |
| Sekretaris | sekretaris@safira.com | password123 |
| Ketua | ketua@safira.com | password123 |
| Pengurus 1 | pengurus1@safira.com | password123 |
| Pengurus 2 | pengurus2@safira.com | password123 |

> ⚠️ **PENTING**: Segera ubah password setelah login pertama!

---

## 🔄 Cara Menjalankan Ulang (Setelah Restart Komputer)

### Terminal 1 - Backend:
```powershell
cd backend
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
node src/server.js
```

### Terminal 2 - Frontend:
```powershell
cd frontend
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
npm run dev
```

---

## 📋 Fitur Utama yang Tersedia

### 1. **Dashboard**
- Statistik surat keluar & masuk
- Notifikasi disposisi
- Ringkasan status surat

### 2. **Surat Keluar** (Admin)
- Buat surat dengan rich text editor (support Arab & tabel)
- Pilih penandatangan (Sekretaris & Ketua)
- Simpan sebagai draft
- Edit surat yang ditolak
- Download PDF dengan QR Code

### 3. **Tanda Tangan Digital** (Sekretaris & Ketua)
- Alur berjenjang: Sekretaris → Ketua
- Fitur tolak dengan catatan perbaikan
- Generate QR Code otomatis
- Nomor surat otomatis

### 4. **Surat Masuk** (Admin/Sekretaris/Ketua)
- Input surat masuk eksternal
- Upload file lampiran
- Buat disposisi ke user lain
- Tracking status disposisi

### 5. **Disposisi** (Semua User)
- Lihat disposisi yang ditujukan kepada Anda
- Tandai sudah dibaca
- Akses langsung ke surat terkait

### 6. **Manajemen User** (Admin)
- Tambah/edit/hapus user
- Reset password user
- Atur role: Admin, Sekretaris, Ketua, Pengurus

### 7. **Profil Organisasi** (Admin)
- Upload logo organisasi
- Atur nama, alamat, kontak
- Kop surat dinamis

### 8. **Verifikasi Publik**
- Scan QR Code untuk verifikasi keaslian surat
- Halaman verifikasi publik (tanpa login)

---

## 🎨 Fitur UI/UX

- ✅ Desain modern dengan tema hijau
- ✅ Responsif (mobile & desktop)
- ✅ Animasi smooth dengan Framer Motion
- ✅ Rich text editor lengkap
- ✅ Support teks Arab (RTL)
- ✅ Support pembuatan tabel
- ✅ Dark mode ready

---

## 🔧 Troubleshooting

### Backend tidak jalan?
```powershell
# Cek apakah PostgreSQL berjalan
Get-Service -Name "postgresql*"

# Jika stopped, start service
Start-Service postgresql-x64-16
```

### Frontend error?
```powershell
# Hapus node_modules dan install ulang
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### Lupa password admin?
```powershell
cd backend
node prisma/seed.js
# Ini akan reset password admin ke admin123
```

---

## 📞 Bantuan Lebih Lanjut

Jika ada masalah, cek:
1. Backend log di terminal backend
2. Frontend log di browser console (F12)
3. Database connection di `backend/.env`

---

## 🎯 Alur Kerja Surat Keluar

1. **Admin** → Buat surat → Pilih penandatangan → Kirim
2. **Sekretaris** → Lihat surat → Tanda tangan / Tolak
3. **Ketua** → Lihat surat → Tanda tangan (verifikasi akhir)
4. **Selesai** → QR Code generated → Download PDF → Kirim ke penerima
5. **Penerima** → Scan QR Code → Verifikasi keaslian

---

**SAFIRA © 2026 — Sistem Administrasi Persuratan Digital**
