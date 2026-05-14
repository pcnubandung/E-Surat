const express = require('express');
const router  = express.Router();
const { getRekapData, exportExcel, exportPDF } = require('../controllers/rekap.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/',        getRekapData);
router.get('/excel',   exportExcel);
router.get('/pdf',     exportPDF);

module.exports = router;
