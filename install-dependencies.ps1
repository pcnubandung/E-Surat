# SAFIRA - Script Instalasi Dependensi
# Jalankan sebagai Administrator di PowerShell

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SAFIRA - Instalasi Dependensi" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. Install Node.js LTS
Write-Host "[1/2] Menginstall Node.js LTS..." -ForegroundColor Cyan
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Node.js berhasil diinstall!" -ForegroundColor Green
} else {
    Write-Host "  Node.js sudah terinstall atau gagal." -ForegroundColor Yellow
}

# 2. Install PostgreSQL
Write-Host ""
Write-Host "[2/2] Menginstall PostgreSQL 16..." -ForegroundColor Cyan
winget install PostgreSQL.PostgreSQL.16 --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -eq 0) {
    Write-Host "  PostgreSQL berhasil diinstall!" -ForegroundColor Green
} else {
    Write-Host "  PostgreSQL sudah terinstall atau gagal." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Instalasi selesai!" -ForegroundColor Green
Write-Host "  PENTING: Tutup dan buka ulang terminal" -ForegroundColor Yellow
Write-Host "  lalu jalankan: .\setup-safira.ps1" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
