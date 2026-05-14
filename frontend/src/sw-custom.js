import { precacheAndRoute } from 'workbox-precaching'

// Precache aset statis yang di-generate oleh vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Handler push notification untuk service worker
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'SAFIRA', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-org.png',
    badge: data.badge || '/logo-org.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SAFIRA', options)
  )
})

// Klik notifikasi → buka/fokus ke URL terkait
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika sudah ada tab yang terbuka, fokus dan navigasi
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Buka tab baru
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
