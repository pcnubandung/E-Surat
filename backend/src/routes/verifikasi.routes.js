const express = require('express');
const router = express.Router();
const { verifySurat } = require('../controllers/verifikasi.controller');

// Publik - tidak perlu autentikasi
router.get('/:token', verifySurat);

module.exports = router;
