import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusIcon, MagnifyingGlassIcon, InboxIcon,
  EyeIcon, PencilIcon, TrashIcon, DocumentTextIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { suratMasukAPI, suratKeluarAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { getStatusLabel, getStatusClass, formatDate, truncate } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// ── Tampilan khusus PENGURUS: surat keluar yang ditujukan kepadanya ──────────
function SuratMasukPengurus({ search }) {
  const { data, isLoading } = useQuery({
    queryKey: ['surat-keluar-pengurus', search],
    queryFn: () => suratKeluarAPI.getAll({ search, status: 'SELESAI' }).then(r => r.data.data),
  })

  const suratList = data || []

  if (isLoading) return <PageLoader />

  if (suratList.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="Belum ada surat masuk"
        description="Surat yang dikirimkan kepada Anda akan muncul di sini"
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>No. Surat</th>
            <th>Perihal</th>
            <th>Tanggal</th>
            <th>Penandatangan</th>
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
                <div className="text-xs text-gray-400 mt-0.5">Dari: {surat.pembuat?.namaLengkap}</div>
              </td>
              <td className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(surat.tanggalMasehi)}
              </td>
              <td className="text-xs text-gray-500">
                <div>{surat.sekretaris?.namaLengkap || '—'}</div>
                <div>{surat.ketua?.namaLengkap || '—'}</div>
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
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tampilan ADMIN / SEKRETARIS / KETUA: surat masuk eksternal ───────────────
export default function SuratMasukPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const isPengurus = user?.role === 'PENGURUS'
  const canManage  = ['ADMIN', 'SEKRETARIS', 'KETUA'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['surat-masuk', search],
    queryFn: () => suratMasukAPI.getAll({ search }).then(r => r.data),
    enabled: !isPengurus,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => suratMasukAPI.delete(id),
    onSuccess: () => {
      toast.success('Surat masuk berhasil dihapus')
      queryClient.invalidateQueries(['surat-masuk'])
      setDeleteId(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  })

  const suratList = data?.data || []

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Surat Masuk</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isPengurus ? 'Surat yang dikirimkan kepada Anda' : 'Arsip surat masuk organisasi'}
          </p>
        </div>
        {canManage && (
          <Link to="/surat-masuk/tambah" className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Tambah Surat Masuk
          </Link>
        )}
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={isPengurus ? 'Cari perihal atau nomor surat...' : 'Cari perihal, pengirim, atau nomor surat...'}
            className="input-field pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Tampilan khusus PENGURUS */}
        {isPengurus && <SuratMasukPengurus search={search} />}

        {/* Tampilan ADMIN/SEKRETARIS/KETUA */}
        {!isPengurus && (
          isLoading ? (
            <PageLoader />
          ) : suratList.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title="Belum ada surat masuk"
              description="Surat masuk yang ditambahkan akan muncul di sini"
              action={canManage && (
                <Link to="/surat-masuk/tambah" className="btn-primary">
                  <PlusIcon className="w-4 h-4" /> Tambah Surat Masuk
                </Link>
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Surat</th>
                    <th>Pengirim</th>
                    <th>Perihal</th>
                    <th>Tgl Surat</th>
                    <th>Tgl Terima</th>
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
                      <td className="font-medium text-gray-800">{truncate(surat.pengirim, 30)}</td>
                      <td className="text-gray-700">{truncate(surat.perihal, 40)}</td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(surat.tanggalSurat)}</td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(surat.tanggalTerima)}</td>
                      <td>
                        <span className={getStatusClass(surat.status)}>{getStatusLabel(surat.status)}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/surat-masuk/${surat.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          {canManage && (
                            <>
                              <Link
                                to={`/surat-masuk/edit/${surat.id}`}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteId(surat.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Hapus Surat Masuk?"
        message="Data surat masuk yang dihapus tidak dapat dikembalikan."
      />
    </div>
  )
}
