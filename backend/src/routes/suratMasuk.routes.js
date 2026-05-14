const express = require('express');
const router = express.Router();
const {
  getAllSuratMasuk, getSuratMasukById, createSuratMasuk,
  updateSuratMasuk, deleteSuratMasuk, serveFile, getStatistik
} = require('../controllers/suratMasuk.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadSuratMasuk } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/statistik', getStatistik);
router.get('/', getAllSuratMasuk);
router.get('/:id', getSuratMasukById);
router.get('/:id/file', serveFile);

// Admin, Sekretaris, Ketua
router.post('/', authorize('ADMIN', 'SEKRETARIS', 'KETUA'), uploadSuratMasuk.single('file'), createSuratMasuk);
router.put('/:id', authorize('ADMIN', 'SEKRETARIS', 'KETUA'), uploadSuratMasuk.single('file'), updateSuratMasuk);
router.delete('/:id', authorize('ADMIN', 'SEKRETARIS', 'KETUA'), deleteSuratMasuk);

module.exports = router;
