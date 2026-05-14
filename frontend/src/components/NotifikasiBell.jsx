import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolid } from '@heroicons/react/24/solid'
import { notifikasiAPI } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function NotifikasiBell() {
  const [notifikasi, setNotifikasi] = useState([])
  const [belumDibaca, setBelumDibaca] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifikasi = async () => {
    try {
      const { data } = await notifikasiAPI.getAll()
      setNotifikasi(data.data)
      setBelumDibaca(data.belumDibaca)
    } catch {}
  }

  // Polling setiap 30 detik
  useEffect(() => {
    fetchNotifikasi()
    const interval = setInterval(fetchNotifikasi, 30000)
    return () => clearInterval(interval)
  }, [])

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen(prev => !prev)
  }

  const handleKlik = async (item) => {
    if (!item.dibaca) {
      await notifikasiAPI.tandaiDibaca(item.id)
      setNotifikasi(prev => prev.map(n => n.id === item.id ? { ...n, dibaca: true } : n))
      setBelumDibaca(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
    navigate(item.url)
  }

  const handleBacaSemua = async () => {
    await notifikasiAPI.tandaiSemuaDibaca()
    setNotifikasi(prev => prev.map(n => ({ ...n, dibaca: true })))
    setBelumDibaca(0)
  }

  const handleHapusDibaca = async () => {
    setLoading(true)
    await notifikasiAPI.hapusDibaca()
    await fetchNotifikasi()
    setLoading(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        title="Notifikasi"
      >
        {belumDibaca > 0 ? (
          <BellSolid className="w-5 h-5 text-green-600" />
        ) : (
          <BellIcon className="w-5 h-5" />
        )}
        {belumDibaca > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {belumDibaca > 99 ? '99+' : belumDibaca}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800 text-sm">Notifikasi</span>
            <div className="flex gap-2">
              {belumDibaca > 0 && (
                <button
                  onClick={handleBacaSemua}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Baca semua
                </button>
              )}
              {notifikasi.some(n => n.dibaca) && (
                <button
                  onClick={handleHapusDibaca}
                  disabled={loading}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Hapus dibaca
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifikasi.length === 0 ? (
              <div className="py-10 text-center">
                <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada notifikasi</p>
              </div>
            ) : (
              notifikasi.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleKlik(item)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!item.dibaca ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Indikator belum dibaca */}
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!item.dibaca ? 'bg-green-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!item.dibaca ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>
                        {item.judul}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.pesan}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: localeId })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
