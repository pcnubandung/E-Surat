const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, uploadFotoProfil, deleteFotoProfil, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadFotoProfil: uploadFotoMiddleware } = require('../middleware/upload.middleware');

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/foto-profil', authenticate, uploadFotoMiddleware.single('foto'), uploadFotoProfil);
router.delete('/foto-profil', authenticate, deleteFotoProfil);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
