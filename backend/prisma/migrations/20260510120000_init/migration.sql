-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JenisSurat" ADD VALUE 'D';
ALTER TYPE "JenisSurat" ADD VALUE 'E';
ALTER TYPE "JenisSurat" ADD VALUE 'F';
ALTER TYPE "JenisSurat" ADD VALUE 'G';
ALTER TYPE "JenisSurat" ADD VALUE 'H';
ALTER TYPE "JenisSurat" ADD VALUE 'I';
ALTER TYPE "JenisSurat" ADD VALUE 'J';
ALTER TYPE "JenisSurat" ADD VALUE 'K';

-- AlterTable
ALTER TABLE "Disposisi" ADD COLUMN     "dijawabAt" TIMESTAMP(3),
ADD COLUMN     "jawaban" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fotoProfil" TEXT;
