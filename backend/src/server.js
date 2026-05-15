require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust Railway reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 500,
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files untuk uploads — support Railway volume mount
const uploadsDir = process.env.UPLOAD_DIR
  ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../', process.env.UPLOAD_DIR))
  : path.join(__dirname, '../uploads');
console.log('📁 UPLOAD_DIR env:', process.env.UPLOAD_DIR);
console.log('📁 Serving uploads from:', uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/surat-keluar', require('./routes/suratKeluar.routes'));
app.use('/api/surat-masuk', require('./routes/suratMasuk.routes'));
app.use('/api/disposisi', require('./routes/disposisi.routes'));
app.use('/api/organisasi', require('./routes/organisasi.routes'));
app.use('/api/verifikasi', require('./routes/verifikasi.routes'));
app.use('/api/rekap', require('./routes/rekap.routes'));
app.use('/api/push', require('./routes/push.routes'));
app.use('/api/notifikasi', require('./routes/notifikasi.routes'));
app.use('/api/agenda', require('./routes/agenda.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SAFIRA API berjalan dengan baik',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SAFIRA Backend berjalan di port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
