const express = require('express');
const router = express.Router();
const {
  getAllSurat, getSuratById, createSurat, updateSurat,
  deleteSurat, kirimSurat, tandaTangan, tolakSurat,
  downloadPDF, previewPDF, getStatistik
} = require('../controllers/suratKeluar.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/statistik', getStatistik);
router.get('/', getAllSurat);
router.get('/:id', getSuratById);
router.get('/:id/download', downloadPDF);
router.get('/:id/preview', previewPDF);

// Admin only
router.post('/', authorize('ADMIN'), createSurat);
router.put('/:id', authorize('ADMIN'), updateSurat);
router.delete('/:id', authorize('ADMIN', 'SEKRETARIS', 'KETUA'), deleteSurat);
router.post('/:id/kirim', authorize('ADMIN'), kirimSurat);

// Sekretaris & Ketua
router.post('/:id/tanda-tangan', authorize('SEKRETARIS', 'KETUA'), tandaTangan);
router.post('/:id/tolak', authorize('SEKRETARIS', 'KETUA'), tolakSurat);

module.exports = router;
