const prisma = require('../config/prisma');

// Subscribe push notification
const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Data subscription tidak valid' });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id },
    });

    res.json({ success: true, message: 'Berhasil subscribe notifikasi' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Unsubscribe push notification
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint diperlukan' });

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: req.user.id }
    });

    res.json({ success: true, message: 'Berhasil unsubscribe notifikasi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// Kirim VAPID public key ke frontend
const getVapidKey = async (req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

module.exports = { subscribe, unsubscribe, getVapidKey };
