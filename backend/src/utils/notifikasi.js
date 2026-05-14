const prisma = require('../config/prisma');
const { sendPushToUsers } = require('./pushNotification');

/**
 * Buat notifikasi in-app + kirim push notification sekaligus
 * @param {string|string[]} userIds
 * @param {{ judul: string, pesan: string, url?: string }} payload
 */
const createNotifikasi = async (userIds, payload) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (ids.length === 0) return;

  const { judul, pesan, url = '/' } = payload;

  // Simpan ke database (in-app)
  await prisma.notifikasi.createMany({
    data: ids.map(userId => ({ userId, judul, pesan, url })),
  });

  // Kirim push notification (fire and forget)
  sendPushToUsers(ids, { title: judul, body: pesan, url }).catch(() => {});
};

module.exports = { createNotifikasi };
