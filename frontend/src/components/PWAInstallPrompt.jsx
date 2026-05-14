import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Komponen prompt install PWA
export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstall(false)
      setInstallPrompt(null)
    }
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-green-200 rounded-xl shadow-lg p-4 z-50 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        <img src="/logo-org.png" alt="SAFIRA" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">Install SAFIRA</p>
        <p className="text-xs text-gray-500 mt-0.5">Pasang aplikasi untuk akses lebih cepat</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleInstall}
            className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstall(false)}
            className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  )
}

// Komponen notifikasi update SW
export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-blue-200 rounded-xl shadow-lg p-4 z-50 flex items-start gap-3">
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">Update Tersedia</p>
        <p className="text-xs text-gray-500 mt-0.5">Versi baru SAFIRA siap digunakan</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Perbarui
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  )
}
