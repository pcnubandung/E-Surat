const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

function getBaseUpload() {
  return process.env.UPLOAD_DIR
    ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
    : path.join(__dirname, '../../uploads');
}

/**
 * Ambil logo path dari database
 */
async function getLogoPathFromDB() {
  try {
    const prisma = require('../config/prisma');
    const org = await prisma.organisasiProfil.findFirst();
    if (!org?.logoPath) return null;

    const BASE = getBaseUpload();
    // logoPath disimpan sebagai /uploads/logos/xxx.png
    const logoPath = org.logoPath.startsWith('/uploads')
      ? path.join(BASE, org.logoPath.replace('/uploads', ''))
      : path.join(__dirname, '../../', org.logoPath);

    return fs.existsSync(logoPath) ? logoPath : null;
  } catch (_) {
    return null;
  }
}

/**
 * Generate QR Code dengan logo di tengah (sebagai Buffer PNG)
 */
async function generateQRWithLogo(verifikasiUrl, size = 300) {
  const { createCanvas, loadImage } = require('canvas');

  const canvas = createCanvas(size, size);
  await QRCode.toCanvas(canvas, verifikasiUrl, {
    color: { dark: '#166534', light: '#FFFFFF' },
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
  });

  const ctx = canvas.getContext('2d');
  const logoPath = await getLogoPathFromDB();

  if (logoPath) {
    try {
      const logoImg = await loadImage(logoPath);
      const logoSize = size * 0.24;
      const cx = size / 2;
      const cy = size / 2;
      const circleR = (logoSize / 2) * 1.3;

      // Border hijau
      ctx.beginPath();
      ctx.arc(cx, cy, circleR + 3, 0, Math.PI * 2);
      ctx.fillStyle = '#166534';
      ctx.fill();

      // Lingkaran putih
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Logo di dalam lingkaran (clip)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, circleR - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
      ctx.restore();
    } catch (e) {
      console.error('QR logo error:', e.message);
    }
  }

  return canvas.toBuffer('image/png');
}

/**
 * Generate QR Code untuk surat — simpan ke file
 */
async function generateQRCode(token, suratId) {
  const qrDir = path.join(getBaseUpload(), 'qrcodes');
  ensureDir(qrDir);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifikasiUrl = `${frontendUrl}/verifikasi/${token}`;
  const filename = `qr-${suratId}.png`;
  const filepath = path.join(qrDir, filename);

  try {
    const buffer = await generateQRWithLogo(verifikasiUrl, 300);
    fs.writeFileSync(filepath, buffer);
  } catch (e) {
    console.error('generateQRCode error:', e.message);
    await QRCode.toFile(filepath, verifikasiUrl, {
      color: { dark: '#166534', light: '#FFFFFF' },
      width: 300, margin: 2, errorCorrectionLevel: 'H'
    });
  }

  return `/uploads/qrcodes/${filename}`;
}

/**
 * Generate QR Code sebagai Data URL (base64) — untuk PDF
 */
async function generateQRCodeDataURL(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifikasiUrl = `${frontendUrl}/verifikasi/${token}`;

  try {
    const buffer = await generateQRWithLogo(verifikasiUrl, 300);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (e) {
    console.error('generateQRCodeDataURL error:', e.message);
    return await QRCode.toDataURL(verifikasiUrl, {
      color: { dark: '#166534', light: '#FFFFFF' },
      width: 300, margin: 1, errorCorrectionLevel: 'H'
    });
  }
}

module.exports = { generateQRCode, generateQRCodeDataURL };
