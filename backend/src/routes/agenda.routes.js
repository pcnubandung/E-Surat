const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getAllAgenda, getUpcomingAgenda, getAgendaById,
  createAgenda, updateAgenda, deleteAgenda,
  getQRCode, absenAplikasi,
  getAgendaByToken, absenForm,
  rekapAgendaExcel, rekapKehadiranExcel, getRiwayatPresensi,
} = require('../controllers/agenda.controller');

// Publik (tanpa login)
router.get('/publik/:token', getAgendaByToken);
router.post('/publik/:token/absen', absenForm);

// Protected
router.get('/upcoming', authenticate, getUpcomingAgenda);
router.get('/riwayat', authenticate, getRiwayatPresensi);
router.get('/', authenticate, getAllAgenda);
router.get('/:id', authenticate, getAgendaById);
router.get('/:id/qrcode', authenticate, getQRCode);
router.post('/:token/absen', authenticate, absenAplikasi);

// Admin only
router.post('/', authenticate, authorize('ADMIN'), createAgenda);
router.put('/:id', authenticate, authorize('ADMIN'), updateAgenda);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteAgenda);
router.get('/rekap/agenda-excel', authenticate, authorize('ADMIN'), rekapAgendaExcel);
router.get('/:id/rekap/kehadiran-excel', authenticate, authorize('ADMIN'), rekapKehadiranExcel);

module.exports = router;
