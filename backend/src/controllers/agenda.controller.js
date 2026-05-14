const prisma = require('../config/prisma');
const { createNotifikasi } = require('../utils/notifikasi');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const agendaInclude = {
  pembuat: { select: { id: true, namaLengkap: true, jabatan: true } },
  peserta: {
    include: { user: { select: { id: true, namaLengkap: true, jabatan: true, role: true, fotoProfil: true } } }
  },
  _count: { select: { kehadiran: true } }
};

// ── GET ALL ──────────────────────────────────────────────────────────────────
const getAllAgenda = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    // Pengurus hanya lihat agenda yang mereka diundang
    if (req.user.role === 'PENGURUS') {
      where.peserta = { some: { userId: req.user.id } };
    }
    if (search) {
      where.OR = [
        { namaAgenda: { contains: search, mode: 'insensitive' } },
        { penyelenggara: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [agenda, total] = await Promise.all([
      prisma.agenda.findMany({ where, include: agendaInclude, orderBy: { tanggal: 'desc' }, skip, take: parseInt(limit) }),
      prisma.agenda.count({ where }),
    ]);

    res.json({ success: true, data: agenda, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── GET UPCOMING (untuk dashboard) ───────────────────────────────────────────
const getUpcomingAgenda = async (req, res) => {
  try {
    let where = { tanggal: { gte: new Date() } };
    if (req.user.role === 'PENGURUS') {
      where.peserta = { some: { userId: req.user.id } };
    }
    const agenda = await prisma.agenda.findMany({
      where,
      include: agendaInclude,
      orderBy: { tanggal: 'asc' },
      take: 5,
    });
    res.json({ success: true, data: agenda });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────────────
const getAgendaById = async (req, res) => {
  try {
    const agenda = await prisma.agenda.findUnique({
      where: { id: req.params.id },
      include: {
        ...agendaInclude,
        kehadiran: {
          include: { user: { select: { id: true, namaLengkap: true, jabatan: true, fotoProfil: true } } },
          orderBy: { waktuHadir: 'asc' }
        }
      }
    });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });
    res.json({ success: true, data: agenda });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
const createAgenda = async (req, res) => {
  try {
    const { namaAgenda, penyelenggara, kategori, tipe, tempat, tanggal, waktuMulai, waktuSelesai, zonaWaktu, deskripsi, pesertaIds } = req.body;

    if (!namaAgenda || !penyelenggara || !tempat || !tanggal || !waktuMulai || !waktuSelesai) {
      return res.status(400).json({ success: false, message: 'Field wajib tidak lengkap' });
    }

    const agenda = await prisma.agenda.create({
      data: {
        namaAgenda, penyelenggara,
        kategori: kategori || 'RAPAT',
        tipe: tipe || 'LURING',
        tempat,
        tanggal: new Date(tanggal),
        waktuMulai, waktuSelesai,
        zonaWaktu: zonaWaktu || 'WIB',
        deskripsi: deskripsi || null,
        pembuatId: req.user.id,
        peserta: pesertaIds?.length
          ? { create: pesertaIds.map(uid => ({ userId: uid })) }
          : undefined,
      },
      include: agendaInclude,
    });

    res.status(201).json({ success: true, message: 'Agenda berhasil dibuat', data: agenda });

    // Notifikasi ke peserta
    if (pesertaIds?.length) {
      const ids = pesertaIds.filter(id => id !== req.user.id);
      if (ids.length > 0) {
        await createNotifikasi(ids, {
          judul: '📅 Undangan Agenda',
          pesan: `Anda diundang ke agenda "${namaAgenda}"`,
          url: `/agenda/${agenda.id}`,
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
const updateAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.agenda.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

    const { namaAgenda, penyelenggara, kategori, tipe, tempat, tanggal, waktuMulai, waktuSelesai, zonaWaktu, deskripsi, pesertaIds } = req.body;

    // Reset peserta
    if (pesertaIds !== undefined) {
      await prisma.pesertaAgenda.deleteMany({ where: { agendaId: id } });
    }

    const updated = await prisma.agenda.update({
      where: { id },
      data: {
        namaAgenda:    namaAgenda    ?? existing.namaAgenda,
        penyelenggara: penyelenggara ?? existing.penyelenggara,
        kategori:      kategori      ?? existing.kategori,
        tipe:          tipe          ?? existing.tipe,
        tempat:        tempat        ?? existing.tempat,
        tanggal:       tanggal       ? new Date(tanggal) : existing.tanggal,
        waktuMulai:    waktuMulai    ?? existing.waktuMulai,
        waktuSelesai:  waktuSelesai  ?? existing.waktuSelesai,
        zonaWaktu:     zonaWaktu     ?? existing.zonaWaktu,
        deskripsi:     deskripsi     !== undefined ? deskripsi : existing.deskripsi,
        peserta: pesertaIds?.length
          ? { create: pesertaIds.map(uid => ({ userId: uid })) }
          : undefined,
      },
      include: agendaInclude,
    });

    res.json({ success: true, message: 'Agenda berhasil diperbarui', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
const deleteAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.agenda.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });
    await prisma.agenda.delete({ where: { id } });
    res.json({ success: true, message: 'Agenda berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── GET QR CODE IMAGE ─────────────────────────────────────────────────────────
const getQRCode = async (req, res) => {
  try {
    const agenda = await prisma.agenda.findUnique({ where: { id: req.params.id } });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

    const url = `${process.env.FRONTEND_URL}/hadir/${agenda.qrToken}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    res.json({ success: true, qrDataUrl, url });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── ABSEN VIA APLIKASI (user login) ──────────────────────────────────────────
const absenAplikasi = async (req, res) => {
  try {
    const { token } = req.params;
    const agenda = await prisma.agenda.findUnique({ where: { qrToken: token } });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

    // Cek sudah absen
    const sudahAbsen = await prisma.kehadiran.findFirst({
      where: { agendaId: agenda.id, userId: req.user.id }
    });
    if (sudahAbsen) {
      return res.status(400).json({ success: false, message: 'Anda sudah melakukan absen untuk agenda ini' });
    }

    const kehadiran = await prisma.kehadiran.create({
      data: {
        agendaId: agenda.id,
        userId: req.user.id,
        namaLengkap: req.user.namaLengkap,
        jabatan: req.user.jabatan || null,
        metode: 'APLIKASI',
      }
    });

    res.json({ success: true, message: 'Kehadiran berhasil dicatat', data: { agenda, kehadiran } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── GET INFO AGENDA BY TOKEN (publik, untuk halaman scan) ────────────────────
const getAgendaByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const agenda = await prisma.agenda.findUnique({
      where: { qrToken: token },
      select: {
        id: true, namaAgenda: true, penyelenggara: true, kategori: true,
        tipe: true, tempat: true, tanggal: true, waktuMulai: true,
        waktuSelesai: true, zonaWaktu: true, deskripsi: true,
        _count: { select: { kehadiran: true } }
      }
    });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });
    res.json({ success: true, data: agenda });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── ABSEN VIA FORM (publik, tanpa login) ─────────────────────────────────────
const absenForm = async (req, res) => {
  try {
    const { token } = req.params;
    const { namaLengkap, nomorHp, instansi, jabatan } = req.body;

    if (!namaLengkap?.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap diperlukan' });
    }

    const agenda = await prisma.agenda.findUnique({ where: { qrToken: token } });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

    const kehadiran = await prisma.kehadiran.create({
      data: {
        agendaId: agenda.id,
        namaLengkap: namaLengkap.trim(),
        nomorHp: nomorHp?.trim() || null,
        instansi: instansi?.trim() || null,
        jabatan: jabatan?.trim() || null,
        metode: 'FORM',
      }
    });

    res.json({ success: true, message: 'Kehadiran berhasil dicatat', data: { agenda, kehadiran } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = { getAllAgenda, getUpcomingAgenda, getAgendaById, createAgenda, updateAgenda, deleteAgenda, getQRCode, absenAplikasi, getAgendaByToken, absenForm };


// ── REKAP KEGIATAN (Excel) ────────────────────────────────────────────────────
const rekapAgendaExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const agenda = await prisma.agenda.findMany({
      include: {
        pembuat: { select: { namaLengkap: true } },
        _count: { select: { kehadiran: true, peserta: true } }
      },
      orderBy: { tanggal: 'desc' }
    });

    const rows = agenda.map((a, i) => ({
      'No': i + 1,
      'Nama Agenda': a.namaAgenda,
      'Penyelenggara': a.penyelenggara,
      'Kategori': a.kategori,
      'Tipe': a.tipe,
      'Tempat': a.tempat,
      'Tanggal': new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      'Waktu': `${a.waktuMulai} - ${a.waktuSelesai} ${a.zonaWaktu}`,
      'Jumlah Peserta Diundang': a._count.peserta,
      'Jumlah Hadir': a._count.kehadiran,
      'Dibuat Oleh': a.pembuat.namaLengkap,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Agenda');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Rekap-Agenda.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal export rekap' });
  }
};

// ── REKAP KEHADIRAN PER AGENDA (Excel) ───────────────────────────────────────
const rekapKehadiranExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { id } = req.params;
    const agenda = await prisma.agenda.findUnique({
      where: { id },
      include: {
        kehadiran: { orderBy: { waktuHadir: 'asc' } }
      }
    });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan' });

    const rows = agenda.kehadiran.map((k, i) => ({
      'No': i + 1,
      'Nama Lengkap': k.namaLengkap,
      'Jabatan': k.jabatan || '-',
      'Instansi': k.instansi || '-',
      'Nomor HP': k.nomorHp || '-',
      'Waktu Hadir': new Date(k.waktuHadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Metode': k.metode,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Tambah info agenda di atas tabel
    XLSX.utils.sheet_add_aoa(ws, [
      [`Daftar Hadir: ${agenda.namaAgenda}`],
      [`Tanggal: ${new Date(agenda.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | Waktu: ${agenda.waktuMulai}-${agenda.waktuSelesai} ${agenda.zonaWaktu} | Tempat: ${agenda.tempat}`],
      [],
    ], { origin: 'A1' });
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Hadir');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeName = agenda.namaAgenda.replace(/[^a-zA-Z0-9]/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="Kehadiran-${safeName}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal export kehadiran' });
  }
};

// ── RIWAYAT PRESENSI USER ─────────────────────────────────────────────────────
const getRiwayatPresensi = async (req, res) => {
  try {
    // Admin bisa lihat riwayat user lain, user biasa hanya milik sendiri
    const targetUserId = (req.user.role === 'ADMIN' && req.query.userId) ? req.query.userId : req.user.id;

    const kehadiran = await prisma.kehadiran.findMany({
      where: { userId: targetUserId },
      include: {
        agenda: {
          select: { id: true, namaAgenda: true, kategori: true, tipe: true, tempat: true, tanggal: true, waktuMulai: true, waktuSelesai: true, zonaWaktu: true }
        }
      },
      orderBy: { waktuHadir: 'desc' }
    });

    const total = kehadiran.length;
    res.json({ success: true, data: kehadiran, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = {
  getAllAgenda, getUpcomingAgenda, getAgendaById,
  createAgenda, updateAgenda, deleteAgenda,
  getQRCode, absenAplikasi, getAgendaByToken, absenForm,
  rekapAgendaExcel, rekapKehadiranExcel, getRiwayatPresensi,
};
