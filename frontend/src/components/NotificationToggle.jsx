import { usePushNotification } from '../utils/usePushNotification'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function NotificationToggle() {
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotification()

  // Browser tidak support
  if (!('PushManager' in window)) return null
  // User sudah blokir notifikasi
  if (permission === 'denied') return null

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
      toast.success('Notifikasi dinonaktifkan')
    } else {
      const ok = await subscribe()
      if (ok) toast.success('Notifikasi diaktifkan')
      else toast.error('Izin notifikasi ditolak')
    }
  }

  return (
    <button
      onClick={handleToggle}
      title={isSubscribed ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi'}
      className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
    >
      {isSubscribed ? (
        <BellIcon className="w-5 h-5 text-green-600" />
      ) : (
        <BellSlashIcon className="w-5 h-5" />
      )}
      {isSubscribed && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </button>
  )
}
