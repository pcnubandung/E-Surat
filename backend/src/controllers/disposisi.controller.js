const prisma = require('../config/prisma');
const { createNotifikasi } = require('../utils/notifikasi');

const disposisiInclude = {
  dibuatOleh: { select: { id: true, namaLengkap: true, jabatan: true } },
  penerima:   { select: { id: true, namaLengkap: true, jabatan: true } },
  suratMasuk: { select: { id: true, perihal: true, pengirim: true, nomorSurat: true, filePath: true, tanggalSurat: true, tanggalTerima: true } },
};

// Buat disposisi — support multi-penerima
const createDisposisi = async (req, res) => {
  try {
    const { suratMasukId, penerimaIds, instruksi, catatan } = req.body;

    // Support penerimaId (tunggal, backward compat) atau penerimaIds (array)
    const ids = penerimaIds
      ? (Array.isArray(penerimaIds) ? penerimaIds : [penerimaIds])
      : req.body.penerimaId ? [req.body.penerimaId] : [];

    if (!suratMasukId || ids.length === 0 || !instruksi) {
      return res.status(400).json({
        success: false,
        message: 'Surat masuk, penerima, dan instruksi diperlukan'
      });
    }

    const suratMasuk = await prisma.suratMasuk.findUnique({ where: { id: suratMasukId } });
    if (!suratMasuk) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan' });
    }

    // Buat disposisi untuk setiap penerima
    const created = await Promise.all(ids.map(penerimaId =>
      prisma.disposisi.create({
        data: {
          suratMasukId,
          penerimaId,
          instruksi,
          catatan: catatan || null,
          dibuatOlehId: req.user.id,
        },
        include: disposisiInclude,
      })
    ));

    // Update status surat masuk
    await prisma.suratMasuk.update({
      where: { id: suratMasukId },
      data: { status: 'DIDISPOSISI' }
    });

    res.status(201).json({
      success: true,
      message: `Disposisi berhasil dibuat untuk ${created.length} penerima`,
      data: created,
    });

    // Notifikasi ke semua penerima disposisi
    await createNotifikasi(ids, {
      judul: '📋 Disposisi Baru',
      pesan: `Anda mendapat disposisi: "${instruksi.substring(0, 60)}${instruksi.length > 60 ? '...' : ''}"`,
      url: `/disposisi`,
    });
  } catch (error) {
    console.error('Create disposisi error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get disposisi untuk surat masuk tertentu
const getDisposisiBySurat = async (req, res) => {
  try {
    const { suratMasukId } = req.params;
    const disposisi = await prisma.disposisi.findMany({
      where: { suratMasukId },
      include: {
        dibuatOleh: { select: { id: true, namaLengkap: true, jabatan: true } },
        penerima:   { select: { id: true, namaLengkap: true, jabatan: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: disposisi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get disposisi milik user yang login
const getMyDisposisi = async (req, res) => {
  try {
    const { sudahDibaca } = req.query;
    const where = { penerimaId: req.user.id };
    if (sudahDibaca !== undefined) where.sudahDibaca = sudahDibaca === 'true';

    const disposisi = await prisma.disposisi.findMany({
      where,
      include: disposisiInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: disposisi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Tandai disposisi sudah dibaca
const tandaiDibaca = async (req, res) => {
  try {
    const { id } = req.params;
    const disposisi = await prisma.disposisi.findUnique({ where: { id } });
    if (!disposisi) return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan' });
    if (disposisi.penerimaId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });

    await prisma.disposisi.update({
      where: { id },
      data: { sudahDibaca: true, dibacaAt: new Date() }
    });
    res.json({ success: true, message: 'Disposisi ditandai sudah dibaca' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Jawab disposisi (Pengurus)
const jawabDisposisi = async (req, res) => {
  try {
    const { id } = req.params;
    const { jawaban } = req.body;

    if (!jawaban?.trim()) {
      return res.status(400).json({ success: false, message: 'Jawaban tidak boleh kosong' });
    }

    const disposisi = await prisma.disposisi.findUnique({ where: { id } });
    if (!disposisi) return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan' });
    if (disposisi.penerimaId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });

    const updated = await prisma.disposisi.update({
      where: { id },
      data: {
        jawaban: jawaban.trim(),
        dijawabAt: new Date(),
        sudahDibaca: true,
        dibacaAt: disposisi.dibacaAt || new Date(),
      },
      include: disposisiInclude,
    });

    res.json({ success: true, message: 'Jawaban berhasil dikirim', data: updated });

    // Notifikasi ke pembuat disposisi
    await createNotifikasi(disposisi.dibuatOlehId, {
      judul: '💬 Disposisi Dijawab',
      pesan: `${req.user.namaLengkap} menjawab disposisi: "${jawaban.trim().substring(0, 60)}${jawaban.trim().length > 60 ? '...' : ''}"`,
      url: `/surat-masuk/${disposisi.suratMasukId}`,
    });
  } catch (error) {
    console.error('Jawab disposisi error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Hapus disposisi
const deleteDisposisi = async (req, res) => {
  try {
    const { id } = req.params;
    const disposisi = await prisma.disposisi.findUnique({ where: { id } });
    if (!disposisi) return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan' });
    await prisma.disposisi.delete({ where: { id } });
    res.json({ success: true, message: 'Disposisi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = {
  createDisposisi,
  getDisposisiBySurat,
  getMyDisposisi,
  tandaiDibaca,
  jawabDisposisi,
  deleteDisposisi,
};
