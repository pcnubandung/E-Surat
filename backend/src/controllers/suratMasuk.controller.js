const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');
const { createNotifikasi } = require('../utils/notifikasi');

const suratMasukInclude = {
  uploader: { select: { id: true, namaLengkap: true, jabatan: true } },
  disposisi: {
    include: {
      dibuatOleh: { select: { id: true, namaLengkap: true, jabatan: true } },
      penerima:   { select: { id: true, namaLengkap: true, jabatan: true } },
    },
    orderBy: { createdAt: 'desc' }
  }
};

// Get semua surat masuk
const getAllSuratMasuk = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    if (req.user.role === 'PENGURUS') {
      where.disposisi = { some: { penerimaId: req.user.id } };
    }

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { perihal:    { contains: search, mode: 'insensitive' } },
        { pengirim:   { contains: search, mode: 'insensitive' } },
        { nomorSurat: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [surat, total] = await Promise.all([
      prisma.suratMasuk.findMany({ where, include: suratMasukInclude, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.suratMasuk.count({ where })
    ]);

    res.json({ success: true, data: surat, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Get surat masuk error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get surat masuk by ID
const getSuratMasukById = async (req, res) => {
  try {
    const surat = await prisma.suratMasuk.findUnique({ where: { id: req.params.id }, include: suratMasukInclude });
    if (!surat) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });

    if (req.user.role === 'PENGURUS') {
      const hasAccess = surat.disposisi.some(d => d.penerimaId === req.user.id);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke surat ini' });
      await prisma.disposisi.updateMany({
        where: { suratMasukId: surat.id, penerimaId: req.user.id },
        data: { sudahDibaca: true, dibacaAt: new Date() }
      });
    }

    if (surat.status === 'BARU') {
      await prisma.suratMasuk.update({ where: { id: surat.id }, data: { status: 'DIBACA' } });
    }

    res.json({ success: true, data: surat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Buat surat masuk baru
const createSuratMasuk = async (req, res) => {
  try {
    const { nomorSurat, pengirim, perihal, catatan, tanggalSurat, tanggalTerima } = req.body;

    if (!pengirim || !perihal || !tanggalSurat) {
      return res.status(400).json({ success: false, message: 'Pengirim, perihal, dan tanggal surat diperlukan' });
    }

    const filePath = req.file ? `/uploads/surat-masuk/${req.file.filename}` : null;

    const surat = await prisma.suratMasuk.create({
      data: {
        nomorSurat:   nomorSurat || null,
        pengirim,
        perihal,
        isiSurat:     catatan || null,   // catatan disimpan di field isiSurat
        tanggalSurat: new Date(tanggalSurat),
        tanggalTerima: tanggalTerima ? new Date(tanggalTerima) : new Date(),
        filePath,
        uploaderId: req.user.id,
      },
      include: suratMasukInclude
    });

    res.status(201).json({ success: true, message: 'Surat masuk berhasil ditambahkan', data: surat });

    // Notifikasi ke ADMIN dan SEKRETARIS (kecuali uploader sendiri)
    const penerima = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SEKRETARIS'] }, isActive: true, id: { not: req.user.id } },
      select: { id: true }
    });
    if (penerima.length > 0) {
      await createNotifikasi(penerima.map(u => u.id), {
        judul: '📬 Surat Masuk Baru',
        pesan: `Dari ${surat.pengirim}: "${surat.perihal}"`,
        url: `/surat-masuk/${surat.id}`,
      });
    }
  } catch (error) {
    console.error('Create surat masuk error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Update surat masuk
const updateSuratMasuk = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomorSurat, pengirim, perihal, catatan, tanggalSurat, tanggalTerima } = req.body;

    const existing = await prisma.suratMasuk.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });

    // Jika ada file baru, hapus file lama
    if (req.file && existing.filePath) {
      const oldFile = path.join(__dirname, '../..', existing.filePath);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    const filePath = req.file ? `/uploads/surat-masuk/${req.file.filename}` : existing.filePath;

    const updated = await prisma.suratMasuk.update({
      where: { id },
      data: {
        nomorSurat:    nomorSurat !== undefined ? nomorSurat : existing.nomorSurat,
        pengirim:      pengirim   || existing.pengirim,
        perihal:       perihal    || existing.perihal,
        isiSurat:      catatan    !== undefined ? catatan : existing.isiSurat,
        tanggalSurat:  tanggalSurat  ? new Date(tanggalSurat)  : existing.tanggalSurat,
        tanggalTerima: tanggalTerima ? new Date(tanggalTerima) : existing.tanggalTerima,
        filePath,
      },
      include: suratMasukInclude
    });

    res.json({ success: true, message: 'Surat masuk berhasil diperbarui', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Hapus surat masuk
const deleteSuratMasuk = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.suratMasuk.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });

    if (existing.filePath) {
      const fullPath = path.join(__dirname, '../..', existing.filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await prisma.suratMasuk.delete({ where: { id } });
    res.json({ success: true, message: 'Surat masuk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Serve file surat masuk (untuk preview)
const serveFile = async (req, res) => {
  try {
    const { id } = req.params;
    const surat = await prisma.suratMasuk.findUnique({ where: { id } });
    if (!surat || !surat.filePath) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
    }

    // Cek akses pengurus
    if (req.user.role === 'PENGURUS') {
      const disposisi = await prisma.disposisi.findFirst({ where: { suratMasukId: id, penerimaId: req.user.id } });
      if (!disposisi) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const BASE_UPLOAD = process.env.UPLOAD_DIR
      ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
      : path.join(__dirname, '../../uploads');

    const fullPath = surat.filePath.startsWith('/uploads')
      ? path.join(BASE_UPLOAD, surat.filePath.replace('/uploads', ''))
      : path.join(__dirname, '../..', surat.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan di server' });
    }

    // Deteksi mime type dari ekstensi, atau dari magic bytes jika tidak ada ekstensi
    let ext = path.extname(surat.filePath).toLowerCase();

    // File lama mungkin tidak punya ekstensi (misal: "1234-nama-pdf" tanpa titik)
    // Coba deteksi dari 4 bytes pertama (magic bytes)
    if (!ext) {
      const buf = Buffer.alloc(4);
      const fd = fs.openSync(fullPath, 'r');
      fs.readSync(fd, buf, 0, 4, 0);
      fs.closeSync(fd);
      const hex = buf.toString('hex').toUpperCase();
      if (hex.startsWith('25504446')) ext = '.pdf';       // %PDF
      else if (hex.startsWith('FFD8FF'))  ext = '.jpg';   // JPEG
      else if (hex.startsWith('89504E47')) ext = '.png';  // PNG
      else if (hex.startsWith('52494646')) ext = '.webp'; // RIFF (WebP)
    }

    const mimeTypes = {
      '.pdf':  'application/pdf',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.webp': 'image/webp',
      '.doc':  'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const mime = mimeTypes[ext] || 'application/octet-stream';

    // Nama file yang bersih dengan ekstensi yang benar untuk download
    const baseName = path.basename(surat.filePath).replace(/[^a-zA-Z0-9._-]/g, '-');
    const cleanName = baseName.includes('.') ? baseName : `${baseName}${ext}`;

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${cleanName}"`);
    res.setHeader('X-File-Name', cleanName);
    res.setHeader('X-File-Type', mime);
    fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Statistik
const getStatistik = async (req, res) => {
  try {
    const [total, baru, dibaca, didisposisi] = await Promise.all([
      prisma.suratMasuk.count(),
      prisma.suratMasuk.count({ where: { status: 'BARU' } }),
      prisma.suratMasuk.count({ where: { status: 'DIBACA' } }),
      prisma.suratMasuk.count({ where: { status: 'DIDISPOSISI' } }),
    ]);
    res.json({ success: true, data: { total, baru, dibaca, didisposisi } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = { getAllSuratMasuk, getSuratMasukById, createSuratMasuk, updateSuratMasuk, deleteSuratMasuk, serveFile, getStatistik };
