const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Generate QR Code untuk surat
 * @param {string} token - Token unik surat
 * @param {string} suratId - ID surat
 * @returns {Promise<string>} - Path file QR Code
 */
async function generateQRCode(token, suratId) {
  const qrDir = path.join(__dirname, '../../uploads/qrcodes');
  ensureDir(qrDir);
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifikasiUrl = `${frontendUrl}/verifikasi/${token}`;
  
  const filename = `qr-${suratId}.png`;
  const filepath = path.join(qrDir, filename);
  
  await QRCode.toFile(filepath, verifikasiUrl, {
    color: {
      dark: '#166534',  // Hijau gelap
      light: '#FFFFFF'  // Putih
    },
    width: 200,
    margin: 2,
    errorCorrectionLevel: 'H'
  });
  
  return `/uploads/qrcodes/${filename}`;
}

/**
 * Generate QR Code sebagai Data URL (base64)
 */
async function generateQRCodeDataURL(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifikasiUrl = `${frontendUrl}/verifikasi/${token}`;
  
  const dataUrl = await QRCode.toDataURL(verifikasiUrl, {
    color: {
      dark: '#166534',
      light: '#FFFFFF'
    },
    width: 150,
    margin: 1,
    errorCorrectionLevel: 'H'
  });
  
  return dataUrl;
}

module.exports = { generateQRCode, generateQRCodeDataURL };
