const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { subscribe, unsubscribe, getVapidKey } = require('../controllers/push.controller');

router.get('/vapid-key', authenticate, getVapidKey);
router.post('/subscribe', authenticate, subscribe);
router.post('/unsubscribe', authenticate, unsubscribe);

module.exports = router;
