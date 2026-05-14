const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');

const getProfil = async (req, res) => {
  try {
    let profil = await prisma.organisasiProfil.findFirst();
    if (!profil) {
      profil = await prisma.organisasiProfil.create({
        data: {
          tingkatanOrg: 'Pimpinan Cabang',
          namaOrg:      'Fatayat Nahdlatul Ulama',
          daerahOrg:    'Kota Bandung',
          alamat: '', telepon: '', email: '', website: '',
        },
      });
    }
    res.json({ success: true, data: profil });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

const updateProfil = async (req, res) => {
  try {
    const { tingkatanOrg, namaOrg, daerahOrg, alamat, telepon, email, website } = req.body;
    let profil = await prisma.organisasiProfil.findFirst();

    const updateData = {
      tingkatanOrg: tingkatanOrg ?? profil?.tingkatanOrg ?? 'Pimpinan Cabang',
      namaOrg:      namaOrg      ?? profil?.namaOrg      ?? 'Fatayat Nahdlatul Ulama',
      daerahOrg:    daerahOrg    ?? profil?.daerahOrg    ?? 'Kota Bandung',
      alamat:       alamat       !== undefined ? alamat   : (profil?.alamat   || ''),
      telepon:      telepon      !== undefined ? telepon  : (profil?.telepon  || ''),
      email:        email        !== undefined ? email    : (profil?.email    || ''),
      website:      website      !== undefined ? website  : (profil?.website  || ''),
    };

    if (req.file) {
      if (profil?.logoPath) {
        const old = path.join(__dirname, '../..', profil.logoPath);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      updateData.logoPath = `/uploads/logos/${req.file.filename}`;
    }

    profil = profil
      ? await prisma.organisasiProfil.update({ where: { id: profil.id }, data: updateData })
      : await prisma.organisasiProfil.create({ data: updateData });

    res.json({ success: true, message: 'Profil organisasi diperbarui', data: profil });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

const deleteLogo = async (req, res) => {
  try {
    const profil = await prisma.organisasiProfil.findFirst();
    if (!profil?.logoPath) return res.status(404).json({ success: false, message: 'Logo tidak ditemukan' });
    const logoPath = path.join(__dirname, '../..', profil.logoPath);
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    await prisma.organisasiProfil.update({ where: { id: profil.id }, data: { logoPath: null } });
    res.json({ success: true, message: 'Logo dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = { getProfil, updateProfil, deleteLogo };
