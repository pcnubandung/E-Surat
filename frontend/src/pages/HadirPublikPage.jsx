import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { agendaAPI } from '../services/api'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function HadirPublikPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [sukses, setSukses] = useState(false)
  const [form, setForm] = useState({ namaLengkap: '', nomorHp: '', instansi: '', jabatan: '' })

  const { data: agenda, isLoading } = useQuery({
    queryKey: ['agenda-publik', token],
    queryFn: () => agendaAPI.getByToken(token).then(r => r.data.data),
  })

  const absenMutation = useMutation({
    mutationFn: () => agendaAPI.absenForm(token, form),
    onSuccess: () => setSukses(true),
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal mencatat kehadiran'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.namaLengkap.trim()) { toast.error('Nama lengkap wajib diisi'); return }
    absenMutation.mutate()
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>
  if (!agenda) return <div className="min-h-screen flex items-center justify-center text-gray-400">Agenda tidak ditemukan</div>

  if (sukses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kehadiran Tercatat!</h2>
          <p className="text-gray-500 text-sm">Terima kasih, <strong>{form.namaLengkap}</strong>. Kehadiran Anda pada agenda <strong>{agenda.namaAgenda}</strong> telah berhasil dicatat.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900">
      {/* Header */}
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">{agenda.namaAgenda}</h1>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
          <div>
            <p className="text-green-300 text-xs">Waktu</p>
            <p className="font-medium">{agenda.waktuMulai} - {agenda.waktuSelesai} {agenda.zonaWaktu}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-t-3xl min-h-[60vh] p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Isi Daftar Hadir</h2>
        <p className="text-sm text-gray-500 mb-6">Lengkapi data berikut untuk mencatat kehadiran Anda</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Lengkap *</label>
            <input className="input" placeholder="Masukkan nama lengkap" value={form.namaLengkap} onChange={e => setForm(f => ({ ...f, namaLengkap: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Nomor HP</label>
            <input className="input" type="tel" placeholder="Contoh: 08123456789" value={form.nomorHp} onChange={e => setForm(f => ({ ...f, nomorHp: e.target.value }))} />
          </div>
          <div>
            <label className="label">Asal Instansi / Utusan</label>
            <input className="input" placeholder="Contoh: PC Fatayat NU Kota Bandung" value={form.instansi} onChange={e => setForm(f => ({ ...f, instansi: e.target.value }))} />
          </div>
          <div>
            <label className="label">Jabatan</label>
            <input className="input" placeholder="Contoh: Ketua" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))} />
          </div>
          <button type="submit" disabled={absenMutation.isPending} className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-60 mt-2">
            {absenMutation.isPending ? 'Menyimpan...' : 'Catat Kehadiran'}
          </button>
        </form>
      </div>
    </div>
  )
}
