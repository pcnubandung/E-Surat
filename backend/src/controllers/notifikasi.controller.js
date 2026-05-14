const prisma = require('../config/prisma');

// Ambil notifikasi milik user yang login
const getNotifikasi = async (req, res) => {
  try {
    const notifikasi = await prisma.notifikasi.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const belumDibaca = await prisma.notifikasi.count({
      where: { userId: req.user.id, dibaca: false },
    });

    res.json({ success: true, data: notifikasi, belumDibaca });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Tandai satu notifikasi sebagai dibaca
const tandaiDibaca = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notifikasi.updateMany({
      where: { id, userId: req.user.id },
      data: { dibaca: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Tandai semua notifikasi sebagai dibaca
const tandaiSemuaDibaca = async (req, res) => {
  try {
    await prisma.notifikasi.updateMany({
      where: { userId: req.user.id, dibaca: false },
      data: { dibaca: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Hapus semua notifikasi yang sudah dibaca
const hapusDibaca = async (req, res) => {
  try {
    await prisma.notifikasi.deleteMany({
      where: { userId: req.user.id, dibaca: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = { getNotifikasi, tandaiDibaca, tandaiSemuaDibaca, hapusDibaca };
