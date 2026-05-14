import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { ArrowLeftIcon, QrCodeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function ScanQRPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      // Coba kamera belakang dulu, fallback ke kamera manapun
      const constraints = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true },
      ]

      let stream = null
      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint)
          break
        } catch (_) {
          // coba constraint berikutnya
        }
      }

      if (!stream) {
        if (!cancelled) setError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan dan tidak digunakan aplikasi lain.')
        return
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      video.setAttribute('playsinline', true) // penting untuk iOS
      await video.play()

      if (!cancelled) setScanning(true)

      // Loop scan frame
      const tick = () => {
        if (cancelled) return
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })
          if (code?.data) {
            // QR ditemukan — hentikan kamera dan navigasi
            stream.getTracks().forEach((t) => t.stop())
            cancelled = true
            try {
              const url = new URL(code.data)
              navigate(url.pathname)
            } catch {
              if (code.data.startsWith('/')) navigate(code.data)
              else setError('QR Code tidak valid untuk aplikasi ini')
            }
            return
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    startCamera().catch((err) => {
      if (!cancelled) {
        const msg = String(err)
        if (msg.includes('NotReadableError') || msg.includes('Could not start video source')) {
          setError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera, lalu coba lagi.')
        } else if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setError('Izin kamera ditolak. Buka pengaturan browser dan izinkan akses kamera untuk situs ini.')
        } else {
          setError('Tidak dapat mengakses kamera: ' + msg)
        }
      }
    })

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [navigate, retryKey])

  const handleRetry = () => {
    setError('')
    setScanning(false)
    setRetryKey((k) => k + 1)
  }

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Kembali
      </button>

      <div className="max-w-sm mx-auto text-center">
        <QrCodeIcon className="w-10 h-10 text-green-600 mx-auto mb-2" />
        <h1 className="text-xl font-bold text-gray-900 mb-1">Scan QR Code</h1>
        <p className="text-sm text-gray-500 mb-6">Arahkan kamera ke QR Code agenda</p>

        {error ? (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm text-center">
              {error}
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-gray-100">
            {/* Satu elemen video saja — dikontrol langsung */}
            <video
              ref={videoRef}
              className="w-full rounded-2xl"
              muted
              playsInline
            />
            {/* Canvas tersembunyi untuk proses frame */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay bingkai scan */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 relative">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                </div>
              </div>
            )}

            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-gray-400">Memuat kamera...</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Pastikan QR Code terlihat jelas di dalam bingkai
        </p>
      </div>
    </div>
  )
}
