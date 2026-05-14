const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const prisma = require('../config/prisma');

const USER_SELECT = {
  id: true,
  email: true,
  namaLengkap: true,
  jabatan: true,
  nomorHp: true,
  role: true,
  isActive: true,
  createdAt: true,
};

// Get semua user (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { namaLengkap: 'asc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: USER_SELECT,
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Buat user baru (Admin only)
const createUser = async (req, res) => {
  try {
    const { email, password, namaLengkap, jabatan, nomorHp, role } = req.body;

    if (!email || !password || !namaLengkap || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, nama lengkap, dan role diperlukan' });
    }

    const validRoles = ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        namaLengkap: namaLengkap.trim(),
        jabatan: jabatan?.trim() || '',
        nomorHp: nomorHp?.trim() || '',
        role,
      },
      select: USER_SELECT,
    });

    res.status(201).json({ success: true, message: 'User berhasil dibuat', data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuat user' });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { namaLengkap, jabatan, nomorHp, role, isActive } = req.body;
    const { id } = req.params;

    if (id === req.user.id && role && role !== req.user.role) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat mengubah role diri sendiri' });
    }

    const updateData = {};
    if (namaLengkap !== undefined) updateData.namaLengkap = namaLengkap.trim();
    if (jabatan !== undefined) updateData.jabatan = jabatan.trim();
    if (nomorHp !== undefined) updateData.nomorHp = nomorHp.trim();
    if (role !== undefined) {
      const validRoles = ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Role tidak valid' });
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    res.json({ success: true, message: 'User berhasil diperbarui', data: user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Reset password user (Admin only)
const resetPassword = async (req, res) => {
  try {
    const { passwordBaru } = req.body;
    const { id } = req.params;

    if (!passwordBaru || passwordBaru.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const hashedPassword = await bcrypt.hash(passwordBaru, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });

    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Hapus user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Get user berdasarkan role (untuk dropdown)
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const where = { isActive: true };
    if (role) {
      const roles = role.split(',');
      where.role = { in: roles };
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, namaLengkap: true, jabatan: true, nomorHp: true, role: true },
      orderBy: { namaLengkap: 'asc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Download template Excel untuk import user
const downloadTemplate = async (req, res) => {
  try {
    const headers = [
      ['namaLengkap', 'email', 'password', 'jabatan', 'nomorHp', 'role'],
    ];
    const contoh = [
      ['Siti Aminah', 'siti@contoh.com', 'password123', 'Ketua Bidang', '08123456789', 'PENGURUS'],
      ['Nur Halimah', 'nur@contoh.com', 'password123', 'Sekretaris', '08987654321', 'SEKRETARIS'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...contoh]);

    // Lebar kolom
    ws['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template User');

    // Sheet petunjuk
    const petunjukData = [
      ['PETUNJUK PENGISIAN'],
      [''],
      ['Kolom', 'Keterangan', 'Wajib', 'Contoh'],
      ['namaLengkap', 'Nama lengkap user', 'Ya', 'Siti Aminah'],
      ['email', 'Alamat email (unik)', 'Ya', 'siti@contoh.com'],
      ['password', 'Password awal (min. 6 karakter)', 'Ya', 'password123'],
      ['jabatan', 'Jabatan dalam organisasi', 'Tidak', 'Ketua Bidang'],
      ['nomorHp', 'Nomor handphone', 'Tidak', '08123456789'],
      ['role', 'Role: ADMIN / SEKRETARIS / KETUA / PENGURUS', 'Ya', 'PENGURUS'],
    ];
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
    wsPetunjuk['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 10 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Template-Import-User.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat template' });
  }
};

// Export semua user ke Excel
const exportUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { namaLengkap: 'asc' },
    });

    const ROLE_LABEL = { ADMIN: 'Admin', SEKRETARIS: 'Sekretaris', KETUA: 'Ketua', PENGURUS: 'Pengurus' };

    const rows = users.map((u, i) => ({
      No: i + 1,
      'Nama Lengkap': u.namaLengkap,
      Email: u.email,
      Jabatan: u.jabatan || '',
      'No. Handphone': u.nomorHp || '',
      Role: ROLE_LABEL[u.role] || u.role,
      Status: u.isActive ? 'Aktif' : 'Nonaktif',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 28 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data User');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Data-User.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data user' });
  }
};

// Import user dari Excel
const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File Excel tidak ditemukan' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'File Excel kosong atau format tidak sesuai' });
    }

    const validRoles = ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'];
    const results = { berhasil: 0, gagal: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 karena baris 1 = header

      const namaLengkap = String(row.namaLengkap || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      const password = String(row.password || '').trim();
      const jabatan = String(row.jabatan || '').trim();
      const nomorHp = String(row.nomorHp || '').trim();
      const role = String(row.role || '').trim().toUpperCase();

      // Validasi
      if (!namaLengkap || !email || !password || !role) {
        results.gagal++;
        results.errors.push(`Baris ${rowNum}: namaLengkap, email, password, dan role wajib diisi`);
        continue;
      }
      if (password.length < 6) {
        results.gagal++;
        results.errors.push(`Baris ${rowNum} (${email}): password minimal 6 karakter`);
        continue;
      }
      if (!validRoles.includes(role)) {
        results.gagal++;
        results.errors.push(`Baris ${rowNum} (${email}): role tidak valid (${role})`);
        continue;
      }

      try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          results.gagal++;
          results.errors.push(`Baris ${rowNum} (${email}): email sudah terdaftar`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.user.create({
          data: { email, password: hashedPassword, namaLengkap, jabatan, nomorHp, role },
        });
        results.berhasil++;
      } catch (err) {
        results.gagal++;
        results.errors.push(`Baris ${rowNum} (${email}): ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Import selesai: ${results.berhasil} berhasil, ${results.gagal} gagal`,
      data: results,
    });
  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses file Excel' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getUsersByRole,
  downloadTemplate,
  exportUsers,
  importUsers,
};
