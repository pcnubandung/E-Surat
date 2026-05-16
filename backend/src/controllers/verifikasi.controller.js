const prisma = require('../config/prisma');

// Verifikasi surat berdasarkan token QR Code (publik, tidak perlu auth)
const verifySurat = async (req, res) => {
  try {
    const { token } = req.params;

    const surat = await prisma.suratKeluar.findUnique({
      where: { qrCodeToken: token },
      include: {
        pembuat: { select: { namaLengkap: true, jabatan: true } },
        sekretaris: { select: { namaLengkap: true, jabatan: true } },
        ketua: { select: { namaLengkap: true, jabatan: true } },
        penerimaInternal: {
          include: {
            user: { select: { namaLengkap: true, jabatan: true } }
          }
        }
      }
    });

    if (!surat) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Dokumen tidak ditemukan atau token tidak valid'
      });
    }

    if (surat.status !== 'SELESAI') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Dokumen belum selesai ditandatangani'
      });
    }

    const organisasi = await prisma.organisasiProfil.findFirst();

    res.json({
      success: true,
      valid: true,
      message: 'Dokumen valid dan telah ditandatangani secara elektronik',
      data: {
        nomorSurat: surat.nomorSurat,
        perihal: surat.perihal,
        tanggalMasehi: surat.tanggalMasehi,
        tanggalHijriyah: surat.tanggalHijriyah,
        penandatangan: {
          sekretaris: surat.sekretaris ? {
            nama: surat.sekretaris.namaLengkap,
            jabatan: surat.sekretaris.jabatan,
            tanggalTtd: surat.tglTtdSekretaris,
          } : null,
          ketua: surat.ketua ? {
            nama: surat.ketua.namaLengkap,
            jabatan: surat.ketua.jabatan,
            tanggalTtd: surat.tglTtdKetua,
          } : null,
        },
        organisasi: {
          tingkatan: organisasi?.tingkatanOrg || '',
          nama: organisasi?.namaOrg || 'Fatayat NU',
          daerah: organisasi?.daerahOrg || '',
          alamat: organisasi?.alamat || '',
          logoPath: organisasi?.logoPath || null,
        },
        dibuatOleh: surat.pembuat.namaLengkap,
        tanggalSelesai: surat.tglTtdKetua || surat.tglTtdSekretaris,
      }
    });
  } catch (error) {
    console.error('Verifikasi error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Terjadi kesalahan saat verifikasi'
    });
  }
};

module.exports = { verifySurat };
