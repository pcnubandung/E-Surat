import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { agendaAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarDaysIcon, ClockIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const KATEGORI_STYLE = {
  MUSYAWARAH: 'bg-purple-100 text-purple-700',
  RAPAT:      'bg-blue-100 text-blue-700',
  PENGAJIAN:  'bg-emerald-100 text-emerald-700',
  LAIN_LAIN:  'bg-gray-100 text-gray-600',
}
const KATEGORI_LABEL = { MUSYAWARAH: 'Musyawarah', RAPAT: 'Rapat', PENGAJIAN: 'Pengajian', LAIN_LAIN: 'Lain-lain' }
const METODE_STYLE = {
  APLIKASI: 'bg-emerald-100 text-emerald-700',
  FORM: 'bg-blue-100 text-blue-700',
}

export default function RiwayatPresensiPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['riwayat-presensi'],
    queryFn: () => agendaAPI.getRiwayat().then(r => r.data),
  })

  const riwayat = data?.data || []
  const total = data?.total || 0

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Presensi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kegiatan yang pernah Anda hadiri</p>
      </div>

      {/* Stat */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 text-white">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-green-200 text-sm mt-1">Total Kehadiran</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-3xl font-bold text-emerald-600">
            {riwayat.filter(r => r.metode === 'APLIKASI').length}
          </p>
          <p className="text-gray-500 text-sm mt-1">Via Aplikasi</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-3xl font-bold text-blue-600">
            {riwayat.filter(r => r.metode === 'FORM').length}
          </p>
          <p className="text-gray-500 text-sm mt-1">Via Form</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : riwayat.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDaysIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Belum ada riwayat presensi</p>
          <p className="text-sm text-gray-400 mt-1">Hadiri agenda dan scan QR Code untuk mencatat kehadiran</p>
        </div>
      ) : (
        <div className="space-y-3">
          {riwayat.map(item => (
            <Link
              key={item.id}
              to={`/agenda/${item.agenda.id}`}
              className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm p-4 transition-all group"
            >
              {/* Tanggal */}
              <div className="w-12 h-12 bg-green-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <span className="text-lg font-bold text-green-700 leading-none">
                  {format(new Date(item.agenda.tanggal), 'dd')}
                </span>
                <span className="text-[10px] text-green-500 uppercase font-medium">
                  {format(new Date(item.agenda.tanggal), 'MMM', { locale: localeId })}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                      {item.agenda.namaAgenda}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KATEGORI_STYLE[item.agenda.kategori]}`}>
                        {KATEGORI_LABEL[item.agenda.kategori]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METODE_STYLE[item.metode]}`}>
                        {item.metode}
                      </span>
                    </div>
                  </div>
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    Hadir {format(new Date(item.waktuHadir), 'HH:mm')} · {item.agenda.waktuMulai}–{item.agenda.waktuSelesai} {item.agenda.zonaWaktu}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {item.agenda.tempat}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
