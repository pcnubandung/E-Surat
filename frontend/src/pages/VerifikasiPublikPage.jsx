import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CheckBadgeIcon, XCircleIcon, ShieldCheckIcon,
  DocumentTextIcon, CalendarIcon, UserIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { verifikasiAPI, getUploadUrl } from '../services/api'
import { formatDate, formatDateTime } from '../utils/helpers'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function VerifikasiPublikPage() {
  const { token } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verifikasi', token],
    queryFn: () => verifikasiAPI.verify(token).then(r => r.data),
    retry: false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-emerald-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative"
      >
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-500">Memverifikasi dokumen...</p>
          </div>
        ) : (isError || !data?.valid) ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircleIcon className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dokumen Tidak Valid</h1>
            <p className="text-gray-500 text-sm">
              {data?.message || 'Dokumen tidak ditemukan atau token tidak valid. Pastikan QR Code yang Anda scan berasal dari dokumen resmi.'}
            </p>
            <div className="mt-6 p-4 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600">
                ⚠️ Dokumen ini tidak dapat diverifikasi keasliannya melalui sistem SAFIRA.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckBadgeIcon className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-1">Dokumen Terverifikasi</h1>
              <p className="text-primary-200 text-sm">Dokumen ini asli dan telah ditandatangani secara elektronik</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Organisasi */}
              <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl">
                {data.data.organisasi?.logoPath ? (
                  <img
                    src={getUploadUrl(data.data.organisasi.logoPath)}
                    alt="Logo"
                    className="w-12 h-12 object-contain flex-shrink-0 mt-1"
                  />
                ) : (
                  <BuildingOfficeIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Diterbitkan oleh</p>
                  {data.data.organisasi?.tingkatan && (
                    <p className="font-semibold text-primary-500">{data.data.organisasi.tingkatan}</p>
                  )}
                  <p className="font-semibold text-primary-800">{data.data.organisasi?.nama}</p>
                  {data.data.organisasi?.daerah && (
                    <p className="font-semibold text-primary-500">{data.data.organisasi.daerah}</p>
                  )}
                  {data.data.organisasi?.alamat && (
                    <p className="text-xs text-gray-500 mt-0.5">{data.data.organisasi.alamat}</p>
                  )}
                </div>
              </div>

              {/* Info surat */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Informasi Dokumen</h3>
                {[
                  { icon: DocumentTextIcon, label: 'Nomor Surat', value: data.data.nomorSurat },
                  { icon: DocumentTextIcon, label: 'Perihal', value: data.data.perihal },
                  { icon: CalendarIcon, label: 'Tanggal', value: `${formatDate(data.data.tanggalMasehi)} / ${data.data.tanggalHijriyah}` },
                  { icon: UserIcon, label: 'Dibuat oleh', value: data.data.dibuatOleh },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800">{item.value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Penandatangan */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Penandatangan</h3>
                {data.data.penandatangan?.sekretaris && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckBadgeIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{data.data.penandatangan.sekretaris.nama}</p>
                      <p className="text-xs text-gray-500">{data.data.penandatangan.sekretaris.jabatan}</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        ✓ Ditandatangani: {formatDateTime(data.data.penandatangan.sekretaris.tanggalTtd)}
                      </p>
                    </div>
                  </div>
                )}
                {data.data.penandatangan?.ketua && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckBadgeIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{data.data.penandatangan.ketua.nama}</p>
                      <p className="text-xs text-gray-500">{data.data.penandatangan.ketua.jabatan}</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        ✓ Ditandatangani: {formatDateTime(data.data.penandatangan.ketua.tanggalTtd)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheckIcon className="w-4 h-4 text-primary-500" />
                  <p>Diverifikasi oleh Sistem Administrasi Persuratan SAFIRA</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Waktu verifikasi: {formatDateTime(new Date())}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-primary-200 text-xs mt-4">
          SAFIRA — Smart Fatayat untuk Informasi Risalah dan Administrasi
        </p>
      </motion.div>
    </div>
  )
}
