# Panduan Deploy SAFIRA di VPS Hostinger

## Arsitektur

```
Internet
    │
    ▼
┌─────────────────────────────────┐
│         VPS Hostinger           │
│                                 │
│  Nginx (port 80/443)            │
│    ├── / → Frontend (dist/)     │
│    └── /api → Backend :5000     │
│                                 │
│  Node.js + PM2 (port 5000)      │
│  PostgreSQL (port 5432)         │
└─────────────────────────────────┘
```

---

## Langkah 1: Akses VPS

Di hPanel Hostinger → **VPS** → **Manage** → catat IP Address VPS Anda.

Akses via SSH dari terminal komputer lokal:

```bash
ssh root@IP_VPS_ANDA
```

Masukkan password VPS (ada di email dari Hostinger).

---

## Langkah 2: Install Kebutuhan Server

Jalankan satu per satu di terminal VPS:

### Update sistem
```bash
apt update && apt upgrade -y
```

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # pastikan v20.x.x
```

### Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### Install PM2 (process manager Node.js)
```bash
npm install -g pm2
```

### Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

## Langkah 3: Setup Database PostgreSQL

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Jalankan perintah berikut di dalam psql:
CREATE DATABASE safira_db;
CREATE USER safira_user WITH PASSWORD 'ganti_password_kuat_ini';
GRANT ALL PRIVILEGES ON DATABASE safira_db TO safira_user;
\q
```

Catat: `safira_user` dan password yang Anda buat.

---

## Langkah 4: Upload Project ke VPS

### Opsi A — Git (Recommended)

Jika project sudah di GitHub:

```bash
cd /var/www
git clone https://github.com/username/nama-repo.git safira
```

### Opsi B — Upload Manual via SFTP

Gunakan FileZilla atau WinSCP:
- Host: IP VPS
- Username: `root`
- Password: password VPS
- Port: `22`

Upload seluruh folder project ke `/var/www/safira/`

---

## Langkah 5: Setup Backend

```bash
cd /var/www/safira/backend

# Install dependencies
npm install --production

# Buat file .env
nano .env
```

Isi file `.env` dengan konten berikut (sesuaikan nilainya):

```env
DATABASE_URL="postgresql://safira_user:ganti_password_kuat_ini@localhost:5432/safira_db?schema=public"
JWT_SECRET="ganti-dengan-string-acak-panjang-minimal-32-karakter"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=production
FRONTEND_URL="https://domain-anda.com"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=10485760
VAPID_PUBLIC_KEY="BHL7VIyoOy9PM4ReatA65FgVL9Dri7uxZsp6fRfO9D8wJYxKfzoq1zVXw4k_h3k_lDy4KIyPI6I0ZGdfRFp03YU"
VAPID_PRIVATE_KEY="ukt_YKzu0QzXYisasD40xfvMkl52c6S0-R_2_rwFD5Y"
VAPID_EMAIL="mailto:admin@safira.com"
```

Simpan: `Ctrl+X` → `Y` → `Enter`

```bash
# Buat folder uploads
mkdir -p uploads

# Jalankan migrasi database
npx prisma migrate deploy

# Jalankan seed data awal (akun default)
node prisma/seed.js

# Generate Prisma client
npx prisma generate
```

### Jalankan Backend dengan PM2

```bash
pm2 start src/server.js --name safira-backend
pm2 save
pm2 startup  # ikuti instruksi yang muncul agar PM2 auto-start saat reboot
```

Cek backend berjalan:
```bash
pm2 status
curl http://localhost:5000/api/health
```

---

## Langkah 6: Build & Deploy Frontend

Lakukan ini di **komputer lokal** Anda, bukan di VPS.

Edit `frontend/.env.production`:

```env
VITE_API_URL=/api
```

> Karena frontend dan backend ada di server yang sama (diproxy Nginx), cukup `/api`.

```bash
cd frontend
npm install
npm run build
```

Setelah build selesai, upload folder `frontend/dist/` ke VPS:

```bash
# Dari komputer lokal (gunakan scp)
scp -r frontend/dist/* root@IP_VPS_ANDA:/var/www/safira/frontend/dist/
```

Atau upload via FileZilla ke path `/var/www/safira/frontend/dist/`.

---

## Langkah 7: Konfigurasi Nginx

```bash
nano /etc/nginx/sites-available/safira
```

Isi dengan konfigurasi berikut (ganti `domain-anda.com`):

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;

    # Frontend - serve file statis
    root /var/www/safira/frontend/dist;
    index index.html;

    # Semua route React Router → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ke backend Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy file uploads
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }

    # Ukuran maksimal upload file (10MB)
    client_max_body_size 10M;
}
```

Aktifkan konfigurasi:

```bash
ln -s /etc/nginx/sites-available/safira /etc/nginx/sites-enabled/
nginx -t          # cek tidak ada error
systemctl reload nginx
```

---

## Langkah 8: Pasang SSL (HTTPS)

HTTPS wajib agar PWA dan push notification berfungsi.

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

Ikuti instruksi, masukkan email, setujui terms. Certbot akan otomatis update konfigurasi Nginx dengan SSL.

Cek auto-renewal:
```bash
certbot renew --dry-run
```

---

## Langkah 9: Arahkan Domain ke VPS

Di hPanel Hostinger → **Domains** → pilih domain → **DNS Zone**:

Tambahkan/update record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | IP VPS Anda | 3600 |
| A | `www` | IP VPS Anda | 3600 |

Tunggu propagasi DNS 5–30 menit, lalu buka `https://domain-anda.com`.

---

## Langkah 10: Checklist Akhir

- [ ] `https://domain-anda.com` terbuka dan menampilkan halaman login
- [ ] Login dengan `admin@safira.com` / `admin123` berhasil
- [ ] Upload surat masuk berfungsi
- [ ] Push notification muncul di smartphone
- [ ] PWA bisa diinstall dari browser smartphone

---

## Perintah Berguna Setelah Deploy

```bash
# Lihat log backend
pm2 logs safira-backend

# Restart backend (setelah update kode)
pm2 restart safira-backend

# Update kode dari GitHub
cd /var/www/safira
git pull
cd backend && npm install
npx prisma migrate deploy
pm2 restart safira-backend

# Cek status semua service
pm2 status
systemctl status nginx
systemctl status postgresql
```

---

## Catatan Penting

**File Upload Persisten**
Di VPS, file upload tersimpan permanen di `/var/www/safira/backend/uploads/`. Tidak akan hilang seperti di Railway.

**Backup Database**
Jalankan secara berkala:
```bash
pg_dump -U safira_user safira_db > backup_$(date +%Y%m%d).sql
```

**Firewall**
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```
