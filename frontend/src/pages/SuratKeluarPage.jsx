import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon,
  DocumentTextIcon, EyeIcon, PencilIcon, TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { suratKeluarAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { getStatusLabel, getStatusClass, formatDate, downloadBlob, truncate } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_SEKRETARIS', label: 'Menunggu Sekretaris' },
  { value: 'MENUNGGU_KETUA', label: 'Menunggu Ketua' },
  { value: 'DITOLAK_SEKRETARIS', label: 'Ditolak Sekretaris' },
  { value: 'DITOLAK_KETUA', label: 'Ditolak Ketua' },
  { value: 'SELESAI', label: 'Selesai' },
]

export default function SuratKeluarPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['surat-keluar', search, status],
    queryFn: () => suratKeluarAPI.getAll({ search, status }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => suratKeluarAPI.delete(id),
    onSuccess: () => {
      toast.success('Surat berhasil dihapus')
      queryClient.invalidateQueries(['surat-keluar'])
      setDeleteId(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus surat'),
  })

  const downloadMutation = useMutation({
    mutationFn: (id) => suratKeluarAPI.downloadPDF(id),
    onSuccess: (res, id) => {
      const surat = data?.data?.find(s => s.id === id)
      const filename = `Surat-${surat?.nomorSurat?.replace(/\//g, '-') || id}.pdf`
      downloadBlob(res.data, filename)
      toast.success('PDF berhasil diunduh')
    },
    onError: () => toast.error('Gagal mengunduh PDF'),
  })

  const suratList = data?.data || []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Surat Keluar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola surat keluar organisasi</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link to="/surat-keluar/buat" className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Buat Surat
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari perihal atau nomor surat..."
              className="input-field pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              className="input-field pl-9 pr-8 appearance-none min-w-[180px]"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : suratList.length === 0 ? (
          <EmptyState
            icon={DocumentTextIcon}
            title="Belum ada surat keluar"
            description="Surat keluar yang dibuat akan muncul di sini"
            action={user?.role === 'ADMIN' && (
              <Link to="/surat-keluar/buat" className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Buat Surat Pertama
              </Link>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Surat</th>
                  <th>Perihal</th>
                  <th>Tanggal</th>
                  <th>Penandatangan</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suratList.map((surat, i) => (
                  <motion.tr
                    key={surat.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="font-mono text-xs text-gray-500">
                      {surat.nomorSurat || <span className="text-gray-300">—</span>}
                    </td>
                    <td>
                      <div className="font-medium text-gray-800">{truncate(surat.perihal, 45)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Oleh: {surat.pembuat?.namaLengkap}
                      </div>
                    </td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(surat.tanggalMasehi)}
                    </td>
                    <td className="text-xs text-gray-500">
                      <div>{surat.sekretaris?.namaLengkap || '—'}</div>
                      <div>{surat.ketua?.namaLengkap || '—'}</div>
                    </td>
                    <td>
                      <span className={getStatusClass(surat.status)}>
                        {getStatusLabel(surat.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/surat-keluar/${surat.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        {user?.role === 'ADMIN' && ['DRAFT', 'DITOLAK_SEKRETARIS', 'DITOLAK_KETUA'].includes(surat.status) && (
                          <Link
                            to={`/surat-keluar/edit/${surat.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                        )}
                        {surat.status === 'SELESAI' && (
                          <button
                            onClick={() => downloadMutation.mutate(surat.id)}
                            disabled={downloadMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        )}
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => setDeleteId(surat.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Hapus Surat?"
        message={
          suratList.find(s => s.id === deleteId)?.status === 'SELESAI'
            ? 'Surat ini sudah selesai ditandatangani. Menghapusnya akan menghilangkan data secara permanen dan tidak dapat dikembalikan.'
            : 'Surat yang dihapus tidak dapat dikembalikan.'
        }
      />
    </div>
  )
}
