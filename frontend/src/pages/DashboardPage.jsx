import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon, InboxIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, ClipboardDocumentListIcon,
  PlusIcon, ArrowRightIcon, CalendarDaysIcon, MapPinIcon
} from '@heroicons/react/24/outline'
import { suratKeluarAPI, suratMasukAPI, disposisiAPI, agendaAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import StatsCard from '../components/ui/StatsCard'
import { getStatusLabel, getStatusClass, formatDate } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: statKeluar } = useQuery({
    queryKey: ['stat-keluar'],
    queryFn: () => suratKeluarAPI.getStatistik().then(r => r.data.data),
  })

  const { data: statMasuk } = useQuery({
    queryKey: ['stat-masuk'],
    queryFn: () => suratMasukAPI.getStatistik().then(r => r.data.data),
  })

  const { data: recentKeluar } = useQuery({
    queryKey: ['recent-keluar'],
    queryFn: () => suratKeluarAPI.getAll({ limit: 5 }).then(r => r.data.data),
    enabled: user?.role !== 'PENGURUS',
  })

  // Untuk PENGURUS: surat keluar yang ditujukan kepadanya (sebagai "surat masuk")
  const { data: recentMasukPengurus } = useQuery({
    queryKey: ['recent-masuk-pengurus'],
    queryFn: () => suratKeluarAPI.getAll({ limit: 5, status: 'SELESAI' }).then(r => r.data.data),
    enabled: user?.role === 'PENGURUS',
  })

  const { data: myDisposisi } = useQuery({
    queryKey: ['my-disposisi-unread'],
    queryFn: () => disposisiAPI.getMy({ sudahDibaca: false }).then(r => r.data.data),
    enabled: ['PENGURUS', 'SEKRETARIS', 'KETUA'].includes(user?.role),
  })

  const { data: upcomingAgenda } = useQuery({
    queryKey: ['upcoming-agenda'],
    queryFn: () => agendaAPI.getUpcoming().then(r => r.data.data),
  })

  const greeting = () => 'Assalamu\'alaikum,'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm mb-1">{greeting()}</p>
            <h1 className="text-2xl font-bold mb-1">{user?.namaLengkap}</h1>
            <p className="text-primary-200 text-sm">{user?.jabatan || user?.role}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-primary-200 text-xs">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {(user?.role === 'ADMIN' || user?.role === 'SEKRETARIS' || user?.role === 'KETUA') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Surat Keluar" value={statKeluar?.total} icon={DocumentTextIcon} color="green" delay={0.1} />
          <StatsCard title="Menunggu TTD" value={statKeluar?.menunggu} icon={ClockIcon} color="yellow" delay={0.15} />
          <StatsCard title="Surat Selesai" value={statKeluar?.selesai} icon={CheckCircleIcon} color="blue" delay={0.2} />
          <StatsCard title="Surat Masuk" value={statMasuk?.total} icon={InboxIcon} color="purple" delay={0.25} />
        </div>
      )}

      {/* Notifikasi disposisi untuk pengurus */}
      {myDisposisi && myDisposisi.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <ClipboardDocumentListIcon className="w-4 h-4 text-yellow-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                {myDisposisi.length} disposisi belum dibaca
              </p>
              <p className="text-xs text-yellow-600">Anda memiliki disposisi surat yang perlu ditindaklanjuti</p>
            </div>
            <Link to="/disposisi" className="btn-secondary text-xs py-1.5 px-3">
              Lihat
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Surat — Surat Keluar Terbaru (Admin/Sekretaris/Ketua) atau Surat Masuk Terbaru (Pengurus) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="card-header flex items-center justify-between">
            <h2 className="section-title">
              {user?.role === 'PENGURUS' ? 'Surat Masuk Terbaru' : 'Surat Keluar Terbaru'}
            </h2>
            <Link
              to={user?.role === 'PENGURUS' ? '/surat-masuk' : '/surat-keluar'}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Lihat semua <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Tampilan PENGURUS */}
            {user?.role === 'PENGURUS' && (
              <>
                {(!recentMasukPengurus || recentMasukPengurus.length === 0) && (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada surat</div>
                )}
                {recentMasukPengurus?.map((surat) => (
                  <Link
                    key={surat.id}
                    to={`/surat-keluar/${surat.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <InboxIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{surat.perihal}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {surat.nomorSurat || '—'} · {formatDate(surat.tanggalMasehi)}
                      </p>
                    </div>
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                  </Link>
                ))}
              </>
            )}

            {/* Tampilan ADMIN/SEKRETARIS/KETUA */}
            {user?.role !== 'PENGURUS' && (
              <>
                {(!recentKeluar || recentKeluar.length === 0) && (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada surat</div>
                )}
                {recentKeluar?.map((surat) => (
                  <Link
                    key={surat.id}
                    to={`/surat-keluar/${surat.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <DocumentTextIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{surat.perihal}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {surat.nomorSurat || 'Draft'} · {formatDate(surat.createdAt)}
                      </p>
                    </div>
                    <span className={getStatusClass(surat.status)}>
                      {getStatusLabel(surat.status)}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </div>
          {user?.role === 'ADMIN' && (
            <div className="px-5 py-3 border-t border-gray-50">
              <Link to="/surat-keluar/buat" className="btn-primary w-full justify-center text-sm">
                <PlusIcon className="w-4 h-4" /> Buat Surat Baru
              </Link>
            </div>
          )}
        </motion.div>

        {/* Quick Stats / Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          {/* Surat masuk stats */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Status Surat Masuk</h3>
            <div className="space-y-3">
              {[
                { label: 'Baru', value: statMasuk?.baru, color: 'bg-blue-500' },
                { label: 'Dibaca', value: statMasuk?.dibaca, color: 'bg-gray-400' },
                { label: 'Didisposisi', value: statMasuk?.didisposisi, color: 'bg-purple-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{item.value ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Surat keluar stats */}
          {(user?.role === 'ADMIN' || user?.role === 'SEKRETARIS' || user?.role === 'KETUA') && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Status Surat Keluar</h3>
              <div className="space-y-3">
                {[
                  { label: 'Draft', value: statKeluar?.draft, color: 'bg-gray-400' },
                  { label: 'Menunggu TTD', value: statKeluar?.menunggu, color: 'bg-yellow-500' },
                  { label: 'Selesai', value: statKeluar?.selesai, color: 'bg-green-500' },
                  { label: 'Ditolak', value: statKeluar?.ditolak, color: 'bg-red-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{item.value ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Agenda Mendatang */}
      {upcomingAgenda && upcomingAgenda.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="section-title">Agenda Mendatang</h2>
            <Link to="/agenda" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Lihat semua <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingAgenda.map(item => (
              <Link key={item.id} to={`/agenda/${item.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-700 leading-none">{format(new Date(item.tanggal), 'dd')}</span>
                  <span className="text-[10px] text-green-500 uppercase">{format(new Date(item.tanggal), 'MMM', { locale: localeId })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.namaAgenda}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{item.waktuMulai} {item.zonaWaktu}</span>
                    <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /><span className="truncate max-w-[120px]">{item.tempat}</span></span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{item._count?.kehadiran || 0} hadir</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
