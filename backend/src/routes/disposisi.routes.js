const express = require('express');
const router = express.Router();
const {
  createDisposisi, getDisposisiBySurat,
  getMyDisposisi, tandaiDibaca, jawabDisposisi, deleteDisposisi
} = require('../controllers/disposisi.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/my', getMyDisposisi);
router.get('/surat/:suratMasukId', getDisposisiBySurat);
router.post('/', authorize('ADMIN', 'SEKRETARIS', 'KETUA'), createDisposisi);
router.put('/:id/baca', tandaiDibaca);
router.put('/:id/jawab', jawabDisposisi);
router.delete('/:id', authorize('ADMIN', 'SEKRETARIS', 'KETUA'), deleteDisposisi);

module.exports = router;
