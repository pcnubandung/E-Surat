const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Dapatkan logo path dari organisasi
 */
function getLogoPath() {
  const BASE_UPLOAD = process.env.UPLOAD_DIR
    ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
    : path.join(__dirname, '../../uploads');

  // Cari logo di folder logos
  const logosDir = path.join(BASE_UPLOAD, 'logos');
  if (!fs.existsSync(logosDir)) return null;
  const files = fs.readdirSync(logosDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  return files.length > 0 ? path.join(logosDir, files[files.length - 1]) : null;
}

/**
 * Generate QR Code dengan logo di tengah (sebagai Buffer PNG)
 */
async function generateQRWithLogo(verifikasiUrl, size = 300) {
  const { createCanvas, loadImage } = require('canvas');

  // Generate QR ke canvas
  const canvas = createCanvas(size, size);
  await QRCode.toCanvas(canvas, verifikasiUrl, {
    color: { dark: '#166534', light: '#FFFFFF' },
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H', // Level H agar logo tidak merusak scan
  });

  const ctx = canvas.getContext('2d');

  // Tambah logo di tengah jika ada
  const logoPath = getLogoPath();
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoImg = await loadImage(logoPath);
      const logoSize = size * 0.22; // 22% dari ukuran QR
      const logoX = (size - logoSize) / 2;
      const logoY = (size - logoSize) / 2;

      // Lingkaran putih sebagai background logo
      const circleR = logoSize * 0.62;
      const cx = size / 2;
      const cy = size / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, circleR + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#166534';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Clip logo jadi lingkaran
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, circleR - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch (_) {
      // Jika logo gagal load, QR tetap tampil tanpa logo
    }
  }

  return canvas.toBuffer('image/png');
}

/**
 * Generate QR Code untuk surat — simpan ke file
 */
async function generateQRCode(token, suratId) {
  const BASE_UPLOAD = process.env.UPLOAD_DIR
    ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
    : path.join(__dirname, '../../uploads');
  const qrDir = path.join(BASE_UPLOAD, 'qrcodes');
  ensureDir(qrDir);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifikasiUrl = `${frontendUrl}/verifikasi/${token}`;

  const filename = `qr-${suratId}.png`;
  const filepath = path.join(qrDir, filename);

  try {
    const buffer = await generateQRWithLogo(verifikasiUrl, 300);
    fs.writeFileSync(filepath, buffer);
  } catch (_) {
    // Fallback tanpa logo
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
  } catch (_) {
    // Fallback tanpa logo
    return await QRCode.toDataURL(verifikasiUrl, {
      color: { dark: '#166534', light: '#FFFFFF' },
      width: 300, margin: 1, errorCorrectionLevel: 'H'
    });
  }
}

module.exports = { generateQRCode, generateQRCodeDataURL };
