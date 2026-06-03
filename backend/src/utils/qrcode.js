const QRCode = require('qrcode');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

function getBaseUpload() {
  return process.env.UPLOAD_DIR
    ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
    : path.join(__dirname, '../../uploads');
}

async function getLogoBuffer() {
  try {
    const prisma = require('../config/prisma');
    const org = await prisma.organisasiProfil.findFirst();
    if (!org?.logoPath) return null;

    const BASE = getBaseUpload();
    const logoPath = org.logoPath.startsWith('/uploads')
      ? path.join(BASE, org.logoPath.replace('/uploads', ''))
      : path.join(__dirname, '../../', org.logoPath);

    if (!fs.existsSync(logoPath)) return null;
    return fs.readFileSync(logoPath);
  } catch (_) {
    return null;
  }
}

/**
 * Generate QR Code PNG buffer dengan logo di tengah menggunakan sharp
 */
async function generateQRWithLogo(verifikasiUrl, size = 300) {
  // 1. Generate QR sebagai PNG buffer
  const qrBuffer = await QRCode.toBuffer(verifikasiUrl, {
    type: 'png',
    color: { dark: '#166534', light: '#FFFFFF' },
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
  });

  const logoRaw = await getLogoBuffer();
  if (!logoRaw) return qrBuffer;

  // 2. Ukuran logo = 18% dari QR (diperkecil agar tidak menumpang border)
  const logoSize = Math.round(size * 0.18);

  // 3. Resize logo
  const logoResized = await sharp(logoRaw)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  // 4. Lingkaran putih background — 1.6x ukuran logo agar ada ruang di sekitar logo
  const circleSize = Math.round(logoSize * 1.6);
  const r = Math.round(circleSize / 2);

  // SVG lingkaran sebagai mask
  const circleSvg = Buffer.from(
    `<svg width="${circleSize}" height="${circleSize}">
      <circle cx="${r}" cy="${r}" r="${r - 2}" fill="white" stroke="#166534" stroke-width="3"/>
    </svg>`
  );

  // 5. Composite: lingkaran putih + logo di atasnya
  const logoWithCircle = await sharp(circleSvg)
    .composite([{
      input: logoResized,
      gravity: 'center',
    }])
    .png()
    .toBuffer();

  // 6. Hitung posisi tengah QR
  const offsetX = Math.round((size - circleSize) / 2);
  const offsetY = Math.round((size - circleSize) / 2);

  // 7. Overlay logo+lingkaran ke atas QR
  const result = await sharp(qrBuffer)
    .composite([{
      input: logoWithCircle,
      left: offsetX,
      top: offsetY,
    }])
    .png()
    .toBuffer();

  return result;
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
      width: 300, margin: 2, errorCorrectionLevel: 'H',
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
      width: 300, margin: 1, errorCorrectionLevel: 'H',
    });
  }
}

module.exports = { generateQRCode, generateQRCodeDataURL };
