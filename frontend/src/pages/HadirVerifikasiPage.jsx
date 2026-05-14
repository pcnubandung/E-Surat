import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { agendaAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useState } from 'react'

// Header info agenda (dipakai di kedua tampilan)
function AgendaHeader({ agenda }) {
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">{agenda.namaAgenda}</h1>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-green-300 text-xs">Nama Agenda</p>
          <p className="font-medium">{agenda.namaAgenda}</p>
        </div>
        <div>
          <p className="text-green-300 text-xs">Tempat</p>
          <p className="font-medium">{agenda.tempat}</p>
        </div>
        <div>
          <p className="text-green-300 text-xs">Penyelenggara</p>
          <p className="font-medium">{agenda.penyelenggara}</p>
        </div>
        <div>
          <p className="text-green-300 text-xs">Tanggal</p>
          <p className="font-medium">{format(new Date(agenda.tanggal), 'dd MMMM yyyy', { locale: localeId })}</p>
        </div>
        <div className="col-span-2">
          <p className="text-green-300 text-xs">Waktu</p>
          <p className="font-medium">{agenda.waktuMulai} - {agenda.waktuSelesai} {agenda.zonaWaktu}</p>
        </div>
      </div>
    </div>
  )
}

// Tampilan sukses
function SuksesView({ namaAgenda, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Kehadiran Tercatat!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Kehadiran Anda pada agenda <strong>{namaAgenda}</strong> telah berhasil dicatat.
        </p>
        <button onClick={onBack} className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
          Selesai
        </button>
      </div>
    </div>
  )
}

export default function HadirVerifikasiPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [sukses, setSukses] = useState(false)
  const [formData, setFormData] = useState({ namaLengkap: '', nomorHp: '', instansi: '', jabatan: '' })

  const { data: agenda, isLoading } = useQuery({
    queryKey: ['agenda-token', token],
    queryFn: () => agendaAPI.getByToken(token).then(r => r.data.data),
  })

  // Absen via aplikasi (user login)
  const absenAplikasiMutation = useMutation({
    mutationFn: () => agendaAPI.absenAplikasi(token),
    onSuccess: () => setSukses(true),
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal mencatat kehadiran'),
  })

  // Absen via form (tanpa login)
  const absenFormMutation = useMutation({
    mutationFn: () => agendaAPI.absenForm(token, formData),
    onSuccess: () => setSukses(true),
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal mencatat kehadiran'),
  })

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!formData.namaLengkap.trim()) { toast.error('Nama lengkap wajib diisi'); return }
    absenFormMutation.mutate()
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
      <div className="text-white text-sm">Memuat...</div>
    </div>
  )

  if (!agenda) return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-gray-500">Agenda tidak ditemukan atau QR Code tidak valid.</p>
      </div>
    </div>
  )

  if (sukses) {
    return <SuksesView namaAgenda={agenda.namaAgenda} onBack={() => isAuthenticated ? navigate('/dashboard') : navigate('/')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-green-200 text-sm">
          <ArrowLeftIcon className="w-4 h-4" /> Kembali
        </button>
      </div>

      <AgendaHeader agenda={agenda} />

      <div className="bg-white rounded-t-3xl min-h-[50vh] p-6">
        {isAuthenticated ? (
          // ── Tampilan user login: verifikasi dengan data akun ──
          <>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Verifikasi Data</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Klik tombol di bawah untuk melanjutkan</p>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.fotoProfil
                  ? <img src={user.fotoProfil} className="w-full h-full object-cover" alt="" />
                  : <span className="text-gray-500 text-xl font-semibold">{user?.namaLengkap?.charAt(0)}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.namaLengkap}</p>
                <p className="text-sm text-gray-500">{user?.jabatan}</p>
              </div>
            </div>
            <button
              onClick={() => absenAplikasiMutation.mutate()}
              disabled={absenAplikasiMutation.isPending}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-60"
            >
              {absenAplikasiMutation.isPending ? 'Memproses...' : 'Lanjutkan Verifikasi'}
            </button>
          </>
        ) : (
          // ── Tampilan tamu: isi form manual ──
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Isi Daftar Hadir</h2>
            <p className="text-sm text-gray-500 mb-6">Lengkapi data berikut untuk mencatat kehadiran Anda</p>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Masukkan nama lengkap"
                  value={formData.namaLengkap}
                  onChange={e => setFormData(f => ({ ...f, namaLengkap: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={formData.nomorHp}
                  onChange={e => setFormData(f => ({ ...f, nomorHp: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Asal Instansi / Utusan</label>
                <input
                  className="input"
                  placeholder="Contoh: PC Fatayat NU Kota Bandung"
                  value={formData.instansi}
                  onChange={e => setFormData(f => ({ ...f, instansi: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                <input
                  className="input"
                  placeholder="Contoh: Ketua"
                  value={formData.jabatan}
                  onChange={e => setFormData(f => ({ ...f, jabatan: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                disabled={absenFormMutation.isPending}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-60 mt-2"
              >
                {absenFormMutation.isPending ? 'Menyimpan...' : 'Catat Kehadiran'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
