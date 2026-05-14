const prisma = require('../config/prisma');

const BULAN_ROMAWI = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

/**
 * Buat singkatan dari tingkatan dan nama organisasi
 * Contoh: "Pimpinan Cabang" + "Fatayat Nahdlatul Ulama" → "PC-FNU"
 */
function buatSingkatan(tingkatan, namaOrg) {
  const singkatTingkatan = tingkatan
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const singkatNama = namaOrg
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  return `${singkatTingkatan}-${singkatNama}`;
}

/**
 * Generate nomor surat otomatis
 * Format: 001/A/PC-FNU/V/2026
 * - 001 = urutan surat bulan ini
 * - A   = jenis surat (A/B/C/SK)
 * - PC-FNU = singkatan tingkatan + nama org
 * - V   = bulan romawi
 * - 2026 = tahun
 */
async function generateNomorSurat(jenisSurat = 'A') {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;

  const startOfMonth = new Date(tahun, bulan - 1, 1);
  const endOfMonth   = new Date(tahun, bulan, 0, 23, 59, 59);

  const count = await prisma.suratKeluar.count({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
      nomorSurat: { not: null },
    },
  });

  const urutan = String(count + 1).padStart(3, '0');

  // Ambil profil organisasi
  const profil = await prisma.organisasiProfil.findFirst();
  const tingkatan = profil?.tingkatanOrg || 'Pimpinan Cabang';
  const namaOrg   = profil?.namaOrg      || 'Fatayat Nahdlatul Ulama';
  const singkatan = buatSingkatan(tingkatan, namaOrg);

  return `${urutan}/${jenisSurat}/${singkatan}/${BULAN_ROMAWI[bulan - 1]}/${tahun}`;
}

module.exports = { generateNomorSurat, buatSingkatan };
