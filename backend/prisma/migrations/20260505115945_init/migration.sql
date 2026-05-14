-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS');

-- CreateEnum
CREATE TYPE "SuratStatus" AS ENUM ('DRAFT', 'MENUNGGU_SEKRETARIS', 'MENUNGGU_KETUA', 'DITOLAK_SEKRETARIS', 'DITOLAK_KETUA', 'SELESAI');

-- CreateEnum
CREATE TYPE "SuratMasukStatus" AS ENUM ('BARU', 'DIBACA', 'DIDISPOSISI');

-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('A', 'B', 'C', 'SK');

-- CreateTable
CREATE TABLE "OrganisasiProfil" (
    "id" TEXT NOT NULL,
    "tingkatanOrg" TEXT NOT NULL DEFAULT 'Pimpinan Cabang',
    "namaOrg" TEXT NOT NULL DEFAULT 'Fatayat Nahdlatul Ulama',
    "daerahOrg" TEXT NOT NULL DEFAULT 'Kota Bandung',
    "alamat" TEXT NOT NULL DEFAULT '',
    "telepon" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "logoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisasiProfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL DEFAULT 'PENGURUS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratKeluar" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT,
    "jenisSurat" "JenisSurat" NOT NULL DEFAULT 'A',
    "perihal" TEXT NOT NULL,
    "lampiran" TEXT,
    "isiSurat" TEXT NOT NULL,
    "lampiranIsi" TEXT,
    "tujuanSurat" TEXT,
    "tanggalMasehi" TIMESTAMP(3) NOT NULL,
    "tanggalHijriyah" TEXT NOT NULL,
    "tempatTerbit" TEXT NOT NULL DEFAULT 'Bandung',
    "status" "SuratStatus" NOT NULL DEFAULT 'DRAFT',
    "sekretarisId" TEXT,
    "ketuaId" TEXT,
    "ttdSekretaris" BOOLEAN NOT NULL DEFAULT false,
    "ttdKetua" BOOLEAN NOT NULL DEFAULT false,
    "tglTtdSekretaris" TIMESTAMP(3),
    "tglTtdKetua" TIMESTAMP(3),
    "catatanTolak" TEXT,
    "ditolakOleh" TEXT,
    "qrCodePath" TEXT,
    "qrCodeToken" TEXT,
    "pembuatId" TEXT NOT NULL,
    "penerimaEksternal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratKeluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenerimaInternal" (
    "id" TEXT NOT NULL,
    "suratId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sudahDibaca" BOOLEAN NOT NULL DEFAULT false,
    "dibacaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenerimaInternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratMasuk" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT,
    "pengirim" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "isiSurat" TEXT,
    "lampiran" TEXT,
    "tanggalSurat" TIMESTAMP(3) NOT NULL,
    "tanggalTerima" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SuratMasukStatus" NOT NULL DEFAULT 'BARU',
    "filePath" TEXT,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratMasuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disposisi" (
    "id" TEXT NOT NULL,
    "suratMasukId" TEXT NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "penerimaId" TEXT NOT NULL,
    "instruksi" TEXT NOT NULL,
    "catatan" TEXT,
    "sudahDibaca" BOOLEAN NOT NULL DEFAULT false,
    "dibacaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disposisi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKeluar_nomorSurat_key" ON "SuratKeluar"("nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKeluar_qrCodeToken_key" ON "SuratKeluar"("qrCodeToken");

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_sekretarisId_fkey" FOREIGN KEY ("sekretarisId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_ketuaId_fkey" FOREIGN KEY ("ketuaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_pembuatId_fkey" FOREIGN KEY ("pembuatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaInternal" ADD CONSTRAINT "PenerimaInternal_suratId_fkey" FOREIGN KEY ("suratId") REFERENCES "SuratKeluar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaInternal" ADD CONSTRAINT "PenerimaInternal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratMasuk" ADD CONSTRAINT "SuratMasuk_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_suratMasukId_fkey" FOREIGN KEY ("suratMasukId") REFERENCES "SuratMasuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_penerimaId_fkey" FOREIGN KEY ("penerimaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
