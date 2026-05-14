const express = require('express');
const router = express.Router();
const { getProfil, updateProfil, deleteLogo } = require('../controllers/organisasi.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadLogo } = require('../middleware/upload.middleware');

// Get profil publik (tidak perlu auth untuk kop surat)
router.get('/', getProfil);

// Admin only
router.put('/', authenticate, authorize('ADMIN'), uploadLogo.single('logo'), updateProfil);
router.delete('/logo', authenticate, authorize('ADMIN'), deleteLogo);

module.exports = router;
