const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload directory — support Railway volume mount
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR
  ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
  : path.join(__dirname, '../../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const fotoProfilStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(BASE_UPLOAD_DIR, 'foto-profil');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `foto-${Date.now()}${ext}`);
  }
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(BASE_UPLOAD_DIR, 'logos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});

const suratMasukStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(BASE_UPLOAD_DIR, 'surat-masuk');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${Date.now()}-${name}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan (JPEG, PNG, GIF, WebP)'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung'), false);
  }
};

const uploadLogo = multer({ storage: logoStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadFotoProfil = multer({ storage: fotoProfilStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadSuratMasuk = multer({ storage: suratMasukStorage, fileFilter: documentFilter, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { uploadLogo, uploadFotoProfil, uploadSuratMasuk };
