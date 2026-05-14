-- CreateEnum
CREATE TYPE "KategoriAgenda" AS ENUM ('MUSYAWARAH', 'RAPAT', 'PENGAJIAN', 'LAIN_LAIN');

-- CreateEnum
CREATE TYPE "TipeAgenda" AS ENUM ('LURING', 'DARING', 'HIBRID');

-- CreateEnum
CREATE TYPE "ZonaWaktu" AS ENUM ('WIB', 'WITA', 'WIT');

-- CreateEnum
CREATE TYPE "MetodeKehadiran" AS ENUM ('APLIKASI', 'FORM');

-- CreateTable
CREATE TABLE "Agenda" (
    "id" TEXT NOT NULL,
    "namaAgenda" TEXT NOT NULL,
    "penyelenggara" TEXT NOT NULL,
    "kategori" "KategoriAgenda" NOT NULL DEFAULT 'RAPAT',
    "tipe" "TipeAgenda" NOT NULL DEFAULT 'LURING',
    "tempat" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "waktuMulai" TEXT NOT NULL,
    "waktuSelesai" TEXT NOT NULL,
    "zonaWaktu" "ZonaWaktu" NOT NULL DEFAULT 'WIB',
    "deskripsi" TEXT,
    "qrToken" TEXT NOT NULL,
    "pembuatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesertaAgenda" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesertaAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kehadiran" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "userId" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "nomorHp" TEXT,
    "instansi" TEXT,
    "jabatan" TEXT,
    "metode" "MetodeKehadiran" NOT NULL DEFAULT 'APLIKASI',
    "waktuHadir" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agenda_qrToken_key" ON "Agenda"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "PesertaAgenda_agendaId_userId_key" ON "PesertaAgenda"("agendaId", "userId");

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_pembuatId_fkey" FOREIGN KEY ("pembuatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesertaAgenda" ADD CONSTRAINT "PesertaAgenda_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesertaAgenda" ADD CONSTRAINT "PesertaAgenda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kehadiran" ADD CONSTRAINT "Kehadiran_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kehadiran" ADD CONSTRAINT "Kehadiran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
