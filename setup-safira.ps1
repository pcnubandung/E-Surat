# SAFIRA - Script Setup Otomatis
# Pastikan Node.js dan PostgreSQL sudah terinstall

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SAFIRA - Setup Otomatis" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Cek Node.js
Write-Host "Mengecek Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js $nodeVersion terdeteksi" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Node.js tidak ditemukan!" -ForegroundColor Red
    Write-Host "  Jalankan: .\install-dependencies.ps1" -ForegroundColor Yellow
    exit 1
}

# Cek npm
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "  npm $npmVersion terdeteksi" -ForegroundColor Green
} else {
    Write-Host "  ERROR: npm tidak ditemukan!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Setup Backend
Set-Location backend

Write-Host ""
Write-Host "[1/5] Install dependencies backend..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "[2/5] Generate Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host ""
Write-Host "[3/5] Membuat database..." -ForegroundColor Yellow
Write-Host "  Pastikan PostgreSQL sudah berjalan!" -ForegroundColor Yellow
Write-Host "  Default: postgres/postgres@localhost:5432" -ForegroundColor Yellow
Write-Host ""

# Cek apakah .env sudah ada
if (Test-Path .env) {
    Write-Host "  File .env sudah ada" -ForegroundColor Green
} else {
    Write-Host "  Membuat file .env dari .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "  PENTING: Edit backend/.env dan sesuaikan DATABASE_URL!" -ForegroundColor Red
    Write-Host "  Format: postgresql://USER:PASSWORD@localhost:5432/safira_db" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Tekan Enter setelah selesai edit .env..." -ForegroundColor Yellow
    Read-Host
}

Write-Host ""
Write-Host "[4/5] Migrasi database..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host ""
Write-Host "[5/5] Seed data awal..." -ForegroundColor Yellow
node prisma/seed.js

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Setup Frontend
Set-Location frontend

Write-Host ""
Write-Host "[1/2] Install dependencies frontend..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "[2/2] Membuat file .env..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "  File .env sudah ada" -ForegroundColor Green
} else {
    Copy-Item .env.example .env
    Write-Host "  File .env dibuat" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP SELESAI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Cara menjalankan:" -ForegroundColor Cyan
Write-Host "  1. Terminal 1: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Terminal 2: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Login default:" -ForegroundColor Cyan
Write-Host "  Email: admin@safira.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Akses aplikasi: http://localhost:5173" -ForegroundColor Green
Write-Host ""
