const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');

const userSelect = {
  id: true,
  email: true,
  namaLengkap: true,
  jabatan: true,
  role: true,
  fotoProfil: true,
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password diperlukan'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          namaLengkap: user.namaLengkap,
          jabatan: user.jabatan,
          role: user.role,
          fotoProfil: user.fotoProfil || null,
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login'
    });
  }
};

// Get profil user yang sedang login
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { ...userSelect, isActive: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Update profil sendiri
const updateProfile = async (req, res) => {
  try {
    const { namaLengkap, jabatan } = req.body;
    if (!namaLengkap || namaLengkap.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong' });
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { namaLengkap: namaLengkap.trim(), jabatan: jabatan?.trim() || '' },
      select: userSelect,
    });
    res.json({ success: true, message: 'Profil berhasil diperbarui', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memperbarui profil' });
  }
};

// Upload / ganti foto profil
const uploadFotoProfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File foto diperlukan' });
    }

    // Hapus foto lama jika ada
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { fotoProfil: true } });
    if (existing?.fotoProfil) {
      const oldPath = path.join(__dirname, '../..', existing.fotoProfil);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const fotoProfil = `/uploads/foto-profil/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { fotoProfil },
      select: userSelect,
    });

    res.json({ success: true, message: 'Foto profil berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Upload foto profil error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengupload foto' });
  }
};

// Hapus foto profil
const deleteFotoProfil = async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { fotoProfil: true } });
    if (existing?.fotoProfil) {
      const oldPath = path.join(__dirname, '../..', existing.fotoProfil);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { fotoProfil: null },
      select: userSelect,
    });
    res.json({ success: true, message: 'Foto profil berhasil dihapus', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Ganti password
const changePassword = async (req, res) => {
  try {
    const { passwordLama, passwordBaru } = req.body;

    if (!passwordLama || !passwordBaru) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan baru diperlukan'
      });
    }

    if (passwordBaru.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isValid = await bcrypt.compare(passwordLama, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }

    const hashedPassword = await bcrypt.hash(passwordBaru, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password'
    });
  }
};

module.exports = { login, getMe, updateProfile, uploadFotoProfil, deleteFotoProfil, changePassword };
