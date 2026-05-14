const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllUsers, getUserById, createUser,
  updateUser, resetPassword, deleteUser, getUsersByRole,
  downloadTemplate, exportUsers, importUsers,
} = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Upload ke memory (tidak simpan ke disk)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Semua route butuh autentikasi
router.use(authenticate);

// Get users berdasarkan role (untuk dropdown)
router.get('/by-role', getUsersByRole);

// Admin only routes
router.get('/', authorize('ADMIN'), getAllUsers);
router.post('/', authorize('ADMIN'), createUser);
router.get('/export/excel', authorize('ADMIN'), exportUsers);
router.get('/export/template', authorize('ADMIN'), downloadTemplate);
router.post('/import/excel', authorize('ADMIN'), upload.single('file'), importUsers);
router.get('/:id', authorize('ADMIN'), getUserById);
router.put('/:id', authorize('ADMIN'), updateUser);
router.put('/:id/reset-password', authorize('ADMIN'), resetPassword);
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;
