const webpush = require('web-push');
const prisma = require('../config/prisma');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Kirim push notification ke satu atau beberapa user
 * @param {string|string[]} userIds
 * @param {{ title: string, body: string, url?: string, icon?: string }} payload
 */
const sendPushToUsers = async (userIds, payload) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: ids } }
  });

  if (subscriptions.length === 0) return;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    icon: '/pwa-192x192.svg',
    badge: '/favicon.svg',
  });

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  );

  // Hapus subscription yang sudah tidak valid (410 Gone)
  const expiredEndpoints = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const status = result.reason?.statusCode;
      if (status === 410 || status === 404) {
        expiredEndpoints.push(subscriptions[i].endpoint);
      }
    }
  });

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } }
    });
  }
};

module.exports = { sendPushToUsers };
