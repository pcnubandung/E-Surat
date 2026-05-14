# USER MANUAL APLIKASI SAFIRA
## Sistem Administrasi Fatayat untuk Informasi Risalah dan Arsip

**Versi:** 1.0.0  
**Tahun:** 2026  
**Organisasi:** Fatayat Nahdlatul Ulama

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Akses Aplikasi dan Login](#2-akses-aplikasi-dan-login)
3. [Peran Pengguna](#3-peran-pengguna)
4. [Dashboard](#4-dashboard)
5. [Surat Keluar](#5-surat-keluar)
6. [Surat Masuk](#6-surat-masuk)
7. [Disposisi Surat](#7-disposisi-surat)
8. [Agenda Kegiatan](#8-agenda-kegiatan)
9. [Presensi](#9-presensi)
10. [Rekap Surat](#10-rekap-surat)
11. [Manajemen User](#11-manajemen-user)
12. [Profil Organisasi](#12-profil-organisasi)
13. [Edit Profil](#13-edit-profil)
14. [Verifikasi Dokumen](#14-verifikasi-dokumen)
15. [Notifikasi](#15-notifikasi)
16. [Akun Default](#16-akun-default)

---
## 1. PENDAHULUAN

SAFIRA (Sistem Administrasi Fatayat untuk Informasi Risalah dan Arsip) adalah aplikasi manajemen persuratan digital berbasis web untuk organisasi Fatayat Nahdlatul Ulama.

Fitur utama:
- Pembuatan dan pengelolaan **surat keluar** dengan alur tanda tangan elektronik berjenjang
- Pencatatan dan pengarsipan **surat masuk** dari pihak eksternal
- Sistem **disposisi** surat kepada pengurus
- Pengelolaan **agenda kegiatan** dan presensi digital via QR Code
- **Verifikasi keaslian** dokumen secara publik
- **Rekap dan laporan** surat dalam format Excel dan PDF

### Persyaratan Sistem

- Browser modern: Google Chrome, Mozilla Firefox, Microsoft Edge (versi terbaru)
- Koneksi internet
- Untuk fitur kamera (scan QR / foto surat masuk): perangkat dengan kamera

---

## 2. AKSES APLIKASI DAN LOGIN

### Membuka Aplikasi

Buka browser dan akses alamat aplikasi SAFIRA yang telah disediakan.

### Login

1. Masukkan **Email** dan **Password** Anda
2. Klik tombol **Masuk**
3. Jika berhasil, Anda akan diarahkan ke halaman **Dashboard**

> **Catatan:** Jika lupa password, hubungi Admin untuk melakukan reset password.

### Logout

Klik foto profil atau nama Anda di pojok kanan atas, lalu pilih **Keluar**.

---

## 3. PERAN PENGGUNA (ROLE)

Aplikasi SAFIRA memiliki 4 peran pengguna:

| Peran | Deskripsi |
|-------|-----------|
| **Admin** | Mengelola seluruh sistem: buat surat, manajemen user, profil organisasi, rekap |
| **Sekretaris** | Tanda tangan tahap pertama surat keluar, input surat masuk, buat disposisi |
| **Ketua** | Verifikasi akhir dan tanda tangan utama, input surat masuk, buat disposisi |
| **Pengurus** | Menerima disposisi, melihat surat yang ditujukan kepadanya, presensi agenda |

### Ringkasan Hak Akses

| Fitur | Admin | Sekretaris | Ketua | Pengurus |
|-------|:-----:|:----------:|:-----:|:--------:|
| Buat Surat Keluar | Ya | - | - | - |
| Tanda Tangan Surat | - | Ya | Ya | - |
| Input Surat Masuk | Ya | Ya | Ya | - |
| Buat Disposisi | Ya | Ya | Ya | - |
| Terima Disposisi | - | Ya | Ya | Ya |
| Kelola Agenda | Ya | - | - | - |
| Manajemen User | Ya | - | - | - |
| Profil Organisasi | Ya | - | - | - |
| Rekap Surat | Ya | - | - | - |

---
## 4. DASHBOARD

Dashboard adalah halaman utama setelah login.

### Tampilan Admin / Sekretaris / Ketua

- **Statistik Surat Keluar:** Total surat, menunggu tanda tangan, surat selesai
- **Statistik Surat Masuk:** Total surat masuk
- **Surat Keluar Terbaru:** 5 surat keluar terbaru dengan status
- **Status Surat Masuk:** Ringkasan baru, dibaca, didisposisi
- **Status Surat Keluar:** Ringkasan draft, menunggu TTD, selesai, ditolak
- **Agenda Mendatang:** Daftar kegiatan yang akan datang

### Tampilan Pengurus

- **Surat Masuk Terbaru:** Surat keluar yang ditujukan kepada Anda
- **Notifikasi Disposisi:** Peringatan jika ada disposisi belum dibaca
- **Agenda Mendatang:** Daftar kegiatan yang akan datang

---

## 5. SURAT KELUAR

### 5.1 Melihat Daftar Surat Keluar

- Semua surat keluar ditampilkan dalam tabel
- Gunakan kolom pencarian untuk mencari berdasarkan perihal atau nomor surat
- Filter berdasarkan status: Draft, Menunggu Sekretaris, Menunggu Ketua, Ditolak, Selesai
- Klik baris surat untuk melihat detail

### 5.2 Membuat Surat Keluar Baru *(Admin)*

1. Klik tombol **Buat Surat Keluar**
2. Isi formulir:

   **Informasi Surat:**
   - **Jenis Surat:** Pilih kode jenis (A-K atau SK). Kode ini masuk ke nomor surat otomatis
   - **Perihal:** Isi perihal surat (bisa multi-baris)
   - **Lampiran:** Keterangan lampiran yang tercetak di header surat (contoh: 1 (Satu Lembar))
   - **Tempat Terbit:** Kota tempat surat diterbitkan (default: Bandung)
   - **Tanggal Masehi:** Pilih tanggal. Tanggal Hijriyah otomatis terisi

   **Kepada Yth.:**
   - Isi tujuan surat persis seperti yang ingin dicetak (baris baru = Enter)

   **Isi Surat:**
   - Gunakan editor teks lengkap. Mendukung teks Arab, tabel, bold, italic, dll.

   **Isi Lampiran** *(opsional)*:
   - Akan dicetak di halaman terpisah dengan kop surat

   **Penandatangan** *(sidebar)*:
   - Pilih **Sekretaris** yang akan menandatangani
   - Pilih **Ketua** (opsional). Jika tidak dipilih, surat selesai setelah TTD Sekretaris

   **Distribusi Surat** *(sidebar)*:
   - **Penerima Eksternal:** Nama/instansi penerima di luar organisasi
   - **Penerima Internal:** Pilih anggota yang dapat melihat surat di aplikasi. Gunakan **Pilih Semua** untuk memilih semua pengurus sekaligus

3. Pilih aksi:
   - **Simpan sebagai Draft:** Surat tersimpan, belum dikirim
   - **Kirim ke Sekretaris:** Surat langsung dikirim untuk ditandatangani

### 5.3 Alur Penandatanganan Surat

`
Admin buat surat -> DRAFT
       |
       v (Admin klik Kirim)
MENUNGGU_SEKRETARIS -> Sekretaris tandatangan
       |
       v
MENUNGGU_KETUA -> Ketua tandatangan
       |
       v
SELESAI -> QR Code digenerate -> PDF dapat diunduh

Jika ditolak:
DITOLAK_SEKRETARIS / DITOLAK_KETUA
-> Admin menerima catatan perbaikan -> edit & kirim ulang
`

### 5.4 Menandatangani Surat *(Sekretaris / Ketua)*

1. Buka menu **Surat Keluar**
2. Cari surat dengan status **Menunggu Sekretaris** atau **Menunggu Ketua**
3. Klik surat untuk membuka detail
4. Klik **Preview PDF Surat** untuk memeriksa isi surat
5. Jika setuju, klik **Tandatangani Surat**
6. Jika ada perbaikan, klik **Tolak Surat** dan isi catatan perbaikan

### 5.5 Mengunduh PDF Surat

- Surat yang sudah berstatus **SELESAI** dapat diunduh sebagai PDF
- Klik tombol **Download PDF** di halaman detail surat
- PDF berisi kop surat organisasi, isi surat, tanda tangan, dan QR Code verifikasi

### 5.6 Status Surat Keluar

| Status | Keterangan |
|--------|-----------|
| DRAFT | Surat dibuat, belum dikirim |
| MENUNGGU_SEKRETARIS | Menunggu tanda tangan Sekretaris |
| MENUNGGU_KETUA | Menunggu tanda tangan Ketua |
| DITOLAK_SEKRETARIS | Ditolak oleh Sekretaris |
| DITOLAK_KETUA | Ditolak oleh Ketua |
| SELESAI | Surat selesai, siap diunduh |

### 5.7 Format Nomor Surat

Nomor surat digenerate otomatis dengan format:

`
Urutan / JenisSurat / SingkatanOrg / BulanRomawi / Tahun
Contoh: 001/A/PC-FNU/V/2026
`

---
## 6. SURAT MASUK

### 6.1 Melihat Daftar Surat Masuk

- **Admin/Sekretaris/Ketua:** Melihat semua surat masuk eksternal
- **Pengurus:** Melihat surat keluar SELESAI yang ditujukan kepadanya

### 6.2 Menambah Surat Masuk *(Admin / Sekretaris / Ketua)*

1. Klik tombol **Tambah Surat Masuk**
2. Isi formulir:
   - **Nomor Surat:** Nomor surat dari pengirim (opsional)
   - **Pengirim:** Nama pengirim atau instansi
   - **Perihal:** Perihal surat
   - **Tanggal Surat:** Tanggal yang tertera di surat
   - **Tanggal Terima:** Tanggal surat diterima (default: hari ini)
   - **Catatan:** Keterangan tambahan (opsional)
   - **File Surat:** Upload file PDF, Word, atau gambar (maks. 10MB). Bisa juga langsung foto menggunakan kamera perangkat
3. Klik **Simpan**

### 6.3 Detail Surat Masuk

- Lihat informasi lengkap surat
- **Preview file** lampiran langsung di browser
- Lihat **riwayat disposisi** beserta jawaban dari penerima
- Tombol **Disposisi** untuk mendisposisikan surat *(Admin/Sekretaris/Ketua)*

### 6.4 Status Surat Masuk

| Status | Keterangan |
|--------|-----------|
| BARU | Surat baru masuk, belum dibaca |
| DIBACA | Surat sudah dibuka/dibaca |
| DIDISPOSISI | Surat sudah didisposisikan |

---

## 7. DISPOSISI SURAT

Disposisi adalah instruksi dari pimpinan kepada pengurus untuk menindaklanjuti surat masuk.

### 7.1 Membuat Disposisi *(Admin / Sekretaris / Ketua)*

1. Buka detail **Surat Masuk**
2. Klik tombol **Disposisi**
3. Pada modal disposisi:
   - **Penerima Disposisi:** Pilih satu atau lebih penerima. Gunakan **Pilih Semua** untuk memilih semua pengurus sekaligus
   - **Instruksi:** Tulis instruksi yang harus dilaksanakan (wajib)
   - **Catatan:** Keterangan tambahan (opsional)
4. Klik **Buat Disposisi**

### 7.2 Menerima dan Menjawab Disposisi

1. Buka menu **Disposisi Surat** di sidebar
2. Disposisi belum dibaca ditandai garis biru di sisi kiri dan badge **Baru**
3. Klik **Tandai Dibaca** untuk menandai sudah dibaca
4. Klik **Lihat File Surat** untuk melihat file surat masuk terkait
5. Klik **Jawab** untuk mengirim laporan tindak lanjut
6. Isi jawaban/laporan, lalu klik **Kirim Jawaban**
7. Jawaban dapat diedit kembali dengan klik **Edit Jawaban**

---

## 8. AGENDA KEGIATAN

### 8.1 Melihat Daftar Agenda

- Agenda ditampilkan dalam tampilan kartu (grid)
- Setiap kartu menampilkan: nama agenda, penyelenggara, tanggal, waktu, tempat, jumlah peserta, dan jumlah yang hadir
- Gunakan kolom pencarian untuk mencari agenda

### 8.2 Membuat Agenda *(Admin)*

1. Klik tombol **Buat Agenda**
2. Isi formulir:
   - **Nama Agenda:** Judul kegiatan
   - **Penyelenggara:** Nama penyelenggara
   - **Kategori:** Musyawarah / Rapat / Pengajian / Lain-lain
   - **Tipe:** Luring / Daring / Hibrid
   - **Tempat:** Lokasi kegiatan
   - **Tanggal, Waktu Mulai, Waktu Selesai, Zona Waktu**
   - **Deskripsi:** Keterangan tambahan (opsional)
   - **Peserta:** Pilih anggota yang diundang. Gunakan **Pilih Semua** untuk memilih semua pengurus sekaligus
3. Klik **Buat Agenda**

### 8.3 Detail Agenda

Halaman detail menampilkan:
- Informasi lengkap agenda (penyelenggara, tempat, tanggal, waktu)
- **Statistik kehadiran:** Total hadir, via aplikasi, via form
- **Tabel daftar hadir:** Nama, jabatan/instansi, waktu hadir, metode presensi
- **QR Code presensi** *(hanya Admin)*: Untuk dibagikan kepada peserta
- **Daftar peserta diundang** dengan indikator sudah hadir *(hanya Admin)*

### 8.4 Mengunduh Poster QR Code *(Admin)*

1. Buka detail agenda
2. Klik tombol **Unduh QR Code**
3. Poster PNG (800x1100px) akan terunduh, berisi:
   - Logo organisasi
   - QR Code presensi
   - Nama agenda, tanggal dan waktu
   - Panduan cara presensi (via aplikasi dan via form)

### 8.5 Mengunduh Rekap Kehadiran *(Admin)*

- Di halaman detail agenda, klik **Unduh Excel** (muncul jika ada peserta yang hadir)
- File Excel berisi daftar lengkap peserta yang hadir

---

## 9. PRESENSI

Fitur presensi memungkinkan pencatatan kehadiran peserta pada agenda kegiatan secara digital, baik melalui aplikasi maupun formulir publik.

### 9.1 Presensi via Aplikasi (Pengguna Login)

1. Scan QR Code yang ditampilkan oleh Admin pada saat kegiatan berlangsung
2. Jika Anda sudah login, akan muncul halaman konfirmasi kehadiran dengan informasi agenda
3. Klik **Konfirmasi Hadir**
4. Kehadiran Anda tercatat otomatis dengan nama dan jabatan dari profil akun

> **Catatan:** Setiap pengguna hanya dapat melakukan presensi satu kali per agenda.

### 9.2 Presensi via Formulir Publik (Tanpa Login)

Untuk tamu atau peserta yang tidak memiliki akun SAFIRA:

1. Scan QR Code agenda
2. Jika tidak login, akan diarahkan ke halaman **Formulir Presensi Publik**
3. Isi formulir:
   - **Nama Lengkap** *(wajib)*
   - **Nomor HP** *(opsional)*
   - **Instansi** *(opsional)*
   - **Jabatan** *(opsional)*
4. Klik **Kirim Kehadiran**

### 9.3 Scan QR Code via Aplikasi *(Semua Pengguna)*

1. Buka menu **Scan QR** di sidebar
2. Arahkan kamera ke QR Code agenda
3. Sistem akan otomatis mendeteksi dan memproses kehadiran

### 9.4 Riwayat Presensi

1. Buka menu **Riwayat Presensi** di sidebar
2. Tampil daftar semua agenda yang pernah Anda hadiri, beserta:
   - Nama agenda
   - Tanggal dan waktu kegiatan
   - Tempat
   - Waktu Anda hadir
   - Metode presensi (Aplikasi / Form)

> **Admin** dapat melihat riwayat presensi pengguna lain melalui halaman ini dengan memilih nama pengguna yang ingin dilihat.

---

## 10. REKAP SURAT

Fitur rekap memungkinkan Admin melihat, memfilter, dan mengekspor data surat keluar maupun surat masuk.

> **Akses:** Hanya Admin

### 10.1 Membuka Halaman Rekap

Klik menu **Rekap Surat** di sidebar.

### 10.2 Memilih Jenis Rekap

Pilih tab:
- **Surat Keluar** — menampilkan data surat keluar
- **Surat Masuk** — menampilkan data surat masuk

### 10.3 Filter Data

Gunakan filter yang tersedia:
- **Tanggal Mulai** dan **Tanggal Selesai:** Filter berdasarkan rentang tanggal surat
- **Status:** Filter berdasarkan status surat (opsional)

Klik **Tampilkan** untuk memuat data sesuai filter.

### 10.4 Statistik Ringkas

Di bagian atas tabel, ditampilkan ringkasan statistik:

**Surat Keluar:**
- Total surat, Selesai, Menunggu TTD, Ditolak

**Surat Masuk:**
- Total surat, Baru, Dibaca, Didisposisi

### 10.5 Tabel Data Rekap

**Kolom Surat Keluar:**
Nomor Surat, Jenis Surat, Perihal, Tujuan, Tanggal Surat, Tanggal Hijriyah, Pembuat, Sekretaris, Ketua, Status, Tgl TTD Sekretaris, Tgl TTD Ketua, Penerima Eksternal

**Kolom Surat Masuk:**
Nomor Surat, Pengirim, Perihal, Tanggal Surat, Tanggal Diterima, Status, Diinput Oleh, Disposisi Kepada, Catatan

### 10.6 Ekspor Data

**Ekspor ke Excel (.xlsx):**
- Klik tombol **Unduh Excel**
- File Excel terunduh dengan nama `Rekap-Surat-Keluar-[tanggal].xlsx` atau `Rekap-Surat-Masuk-[tanggal].xlsx`

**Ekspor ke PDF:**
- Klik tombol **Unduh PDF**
- File PDF format A4 landscape terunduh, berisi:
  - Kop surat organisasi (logo, nama, alamat)
  - Judul rekap dan periode filter
  - Statistik ringkas
  - Tabel data lengkap dengan nomor halaman

---

## 11. MANAJEMEN USER

Fitur ini memungkinkan Admin mengelola seluruh akun pengguna dalam sistem.

> **Akses:** Hanya Admin

### 11.1 Membuka Halaman Manajemen User

Klik menu **Manajemen User** di sidebar.

### 11.2 Daftar Pengguna

Halaman menampilkan tabel semua pengguna dengan kolom:
- Nama Lengkap, Email, Jabatan, No. HP, Role, Status (Aktif/Nonaktif)

### 11.3 Menambah User Baru

1. Klik tombol **Tambah User**
2. Isi formulir:
   - **Nama Lengkap** *(wajib)*
   - **Email** *(wajib, harus unik)*
   - **Password** *(wajib, minimal 6 karakter)*
   - **Jabatan** *(opsional)*
   - **Nomor HP** *(opsional)*
   - **Role** *(wajib)*: Admin / Sekretaris / Ketua / Pengurus
3. Klik **Simpan**

### 11.4 Mengedit User

1. Klik ikon edit (pensil) pada baris user yang ingin diubah
2. Ubah data yang diperlukan: Nama Lengkap, Jabatan, Nomor HP, Role, atau Status
3. Klik **Simpan**

> **Catatan:** Admin tidak dapat mengubah role akun miliknya sendiri.

### 11.5 Menonaktifkan / Mengaktifkan User

- Pada form edit user, ubah **Status** menjadi **Nonaktif** untuk menonaktifkan akun
- User yang nonaktif tidak dapat login ke sistem
- Ubah kembali ke **Aktif** untuk mengaktifkan ulang

### 11.6 Reset Password User

1. Klik ikon kunci pada baris user
2. Masukkan **Password Baru** (minimal 6 karakter)
3. Klik **Reset Password**
4. Informasikan password baru kepada pengguna yang bersangkutan

### 11.7 Menghapus User

1. Klik ikon hapus (tempat sampah) pada baris user
2. Konfirmasi penghapusan
3. User akan dihapus permanen dari sistem

> **Perhatian:** Admin tidak dapat menghapus akun miliknya sendiri. Penghapusan user bersifat permanen.

### 11.8 Import User dari Excel

Untuk menambahkan banyak user sekaligus:

1. Klik tombol **Unduh Template** untuk mendapatkan file Excel template
2. Isi template sesuai petunjuk di sheet "Petunjuk":

   | Kolom | Keterangan | Wajib |
   |-------|-----------|-------|
   | namaLengkap | Nama lengkap user | Ya |
   | email | Alamat email (harus unik) | Ya |
   | password | Password awal (min. 6 karakter) | Ya |
   | jabatan | Jabatan dalam organisasi | Tidak |
   | nomorHp | Nomor handphone | Tidak |
   | role | ADMIN / SEKRETARIS / KETUA / PENGURUS | Ya |

3. Simpan file Excel
4. Klik tombol **Import Excel**, lalu pilih file yang sudah diisi
5. Sistem akan memproses setiap baris dan menampilkan hasil: berapa yang berhasil dan berapa yang gagal beserta keterangannya

### 11.9 Ekspor Data User ke Excel

- Klik tombol **Ekspor Excel**
- File `Data-User.xlsx` akan terunduh berisi seluruh data pengguna

---

## 12. PROFIL ORGANISASI

Fitur ini mengatur identitas organisasi yang digunakan pada kop surat, PDF rekap, dan poster QR Code.

> **Akses:** Hanya Admin

### 12.1 Membuka Halaman Profil Organisasi

Klik menu **Profil Organisasi** di sidebar.

### 12.2 Mengubah Data Organisasi

1. Edit field yang ingin diubah:
   - **Tingkatan Organisasi:** Contoh: Pimpinan Cabang, Pimpinan Anak Cabang
   - **Nama Organisasi:** Contoh: Fatayat Nahdlatul Ulama
   - **Daerah Organisasi:** Contoh: Kota Bandung
   - **Alamat:** Alamat lengkap kantor/sekretariat
   - **Telepon:** Nomor telepon organisasi
   - **Email:** Alamat email organisasi
   - **Website:** Alamat website (opsional)
2. Klik **Simpan Perubahan**

> Perubahan data organisasi akan langsung tercermin pada kop surat PDF, rekap, dan poster QR Code yang digenerate setelahnya.

### 12.3 Upload Logo Organisasi

1. Klik area upload logo atau tombol **Pilih File**
2. Pilih file gambar (PNG, JPG, JPEG — disarankan format PNG transparan)
3. Logo akan langsung ditampilkan sebagai preview
4. Klik **Simpan Perubahan** untuk menyimpan

### 12.4 Menghapus Logo

- Klik tombol **Hapus Logo** untuk menghapus logo yang terpasang
- Kop surat akan menggunakan teks saja tanpa logo

---

## 13. EDIT PROFIL

Setiap pengguna dapat mengubah data profil pribadinya.

### 13.1 Membuka Halaman Edit Profil

Klik foto profil atau nama Anda di pojok kanan atas, lalu pilih **Edit Profil**. Atau klik menu **Edit Profil** di sidebar.

### 13.2 Mengubah Data Profil

1. Ubah data yang diinginkan:
   - **Nama Lengkap**
   - **Jabatan**
   - **Nomor HP**
2. Klik **Simpan Perubahan**

### 13.3 Upload Foto Profil

1. Klik area foto profil atau tombol **Ganti Foto**
2. Pilih file gambar (JPG, PNG — maks. 2MB)
3. Foto akan ditampilkan sebagai preview
4. Klik **Simpan** untuk mengunggah

### 13.4 Menghapus Foto Profil

- Klik tombol **Hapus Foto** untuk menghapus foto profil
- Foto akan diganti dengan avatar default

### 13.5 Mengubah Password

1. Pada halaman Edit Profil, gulir ke bagian **Ubah Password**
2. Isi:
   - **Password Lama:** Password yang sedang digunakan
   - **Password Baru:** Password baru (minimal 6 karakter)
   - **Konfirmasi Password Baru:** Ulangi password baru
3. Klik **Ubah Password**

> **Catatan:** Jika lupa password lama, minta Admin untuk melakukan reset password.

---

## 14. VERIFIKASI DOKUMEN

Fitur ini memungkinkan siapa saja (termasuk pihak eksternal) untuk memverifikasi keaslian surat keluar yang diterbitkan oleh organisasi.

### 14.1 Cara Verifikasi

**Melalui QR Code pada surat cetak:**
1. Scan QR Code yang tercetak di pojok surat menggunakan kamera smartphone
2. Browser akan membuka halaman verifikasi secara otomatis

**Melalui URL langsung:**
1. Buka browser dan akses: `[alamat-aplikasi]/verifikasi/[token]`

### 14.2 Informasi yang Ditampilkan

Jika surat valid, halaman verifikasi menampilkan:
- **Nomor Surat**
- **Perihal**
- **Tanggal Surat** (Masehi dan Hijriyah)
- **Penandatangan:** Nama Sekretaris dan/atau Ketua beserta tanggal tanda tangan
- **Nama Organisasi Penerbit**
- Status: **✓ Dokumen Terverifikasi**

Jika token tidak valid atau surat belum selesai, akan ditampilkan pesan bahwa dokumen tidak dapat diverifikasi.

> Halaman verifikasi dapat diakses tanpa login, sehingga pihak penerima surat dapat memverifikasi keaslian dokumen kapan saja.

---

## 15. NOTIFIKASI

### 15.1 Notifikasi In-App

Ikon lonceng di pojok kanan atas menampilkan jumlah notifikasi yang belum dibaca.

**Klik ikon lonceng** untuk membuka panel notifikasi yang berisi:
- Judul notifikasi
- Isi pesan
- Waktu notifikasi diterima

Klik salah satu notifikasi untuk langsung diarahkan ke halaman terkait.

### 15.2 Jenis Notifikasi

| Notifikasi | Penerima |
|-----------|---------|
| Surat masuk baru | Admin, Sekretaris |
| Surat menunggu tanda tangan | Sekretaris / Ketua yang ditunjuk |
| Surat selesai ditandatangani | Pembuat surat (Admin) + Penerima internal |
| Surat ditolak | Pembuat surat (Admin) |
| Disposisi baru | Penerima disposisi |
| Disposisi dijawab | Pembuat disposisi |
| Undangan agenda | Peserta yang diundang |

### 15.3 Menandai Notifikasi Sudah Dibaca

- Klik notifikasi untuk menandainya sebagai sudah dibaca sekaligus membuka halaman terkait
- Klik **Tandai Semua Dibaca** untuk menandai semua notifikasi sekaligus

### 15.4 Menghapus Notifikasi

- Klik ikon hapus (×) pada notifikasi tertentu untuk menghapusnya
- Notifikasi yang dihapus tidak dapat dikembalikan

### 15.5 Push Notification (PWA)

Jika aplikasi diinstal sebagai PWA (Progressive Web App) di perangkat Anda:

1. Saat pertama kali membuka aplikasi, akan muncul permintaan izin notifikasi
2. Klik **Izinkan** untuk mengaktifkan push notification
3. Notifikasi akan muncul di perangkat Anda meskipun browser/aplikasi sedang tidak dibuka

Untuk menonaktifkan push notification, ubah pengaturan notifikasi di browser atau sistem operasi perangkat Anda.

---

## 16. AKUN DEFAULT

Setelah instalasi pertama, sistem menyediakan akun Admin bawaan:

| Field | Nilai |
|-------|-------|
| **Email** | admin@safira.com |
| **Password** | admin123 |
| **Role** | Admin |

> **⚠️ Penting:** Segera ubah password akun Admin default setelah login pertama melalui menu **Edit Profil → Ubah Password** untuk menjaga keamanan sistem.

---

## LAMPIRAN: JENIS SURAT

| Kode | Nama Jenis Surat |
|------|-----------------|
| A | Surat Rutin Internal |
| B | Surat Rutin Eksternal |
| C | Surat Keterangan |
| D | Surat Rekomendasi |
| E | Surat Tugas |
| F | Surat Mandat |
| G | Surat Instruksi |
| H | Surat Pengumuman |
| I | Surat Edaran |
| J | Surat Peringatan |
| K | Surat Pernyataan |
| SK | Surat Keputusan |

---

## LAMPIRAN: TROUBLESHOOTING

### Tidak bisa login
- Pastikan email dan password sudah benar (perhatikan huruf besar/kecil)
- Pastikan akun Anda masih aktif (hubungi Admin jika akun dinonaktifkan)
- Hubungi Admin untuk reset password jika lupa

### PDF tidak bisa diunduh
- Pastikan surat sudah berstatus **SELESAI**
- Coba refresh halaman dan unduh ulang
- Pastikan browser tidak memblokir unduhan

### QR Code tidak terbaca
- Pastikan pencahayaan cukup saat scan
- Coba perbesar tampilan QR Code
- Gunakan aplikasi kamera bawaan perangkat

### File surat masuk tidak bisa diupload
- Pastikan ukuran file tidak melebihi **10MB**
- Format yang didukung: PDF, Word (.doc/.docx), gambar (JPG, PNG)
- Coba kompres file jika terlalu besar

### Notifikasi tidak muncul
- Pastikan izin notifikasi browser sudah diaktifkan
- Coba refresh halaman
- Periksa koneksi internet

### Kamera tidak berfungsi untuk scan QR
- Pastikan browser memiliki izin akses kamera
- Gunakan browser Chrome atau Firefox versi terbaru
- Pastikan tidak ada aplikasi lain yang sedang menggunakan kamera

---

*User Manual SAFIRA v1.0.0 — © 2026 Fatayat Nahdlatul Ulama*
