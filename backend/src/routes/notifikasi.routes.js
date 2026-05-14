const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getNotifikasi, tandaiDibaca, tandaiSemuaDibaca, hapusDibaca } = require('../controllers/notifikasi.controller');

router.get('/', authenticate, getNotifikasi);
router.patch('/:id/baca', authenticate, tandaiDibaca);
router.patch('/baca-semua', authenticate, tandaiSemuaDibaca);
router.delete('/hapus-dibaca', authenticate, hapusDibaca);

module.exports = router;
