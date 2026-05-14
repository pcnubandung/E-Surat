import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon, PencilIcon, PlusIcon,
  ClipboardDocumentListIcon, UserIcon, EyeIcon,
  DocumentIcon, XMarkIcon, CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { suratMasukAPI, disposisiAPI, userAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { formatDate, formatDateTime } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import FilePreviewModal from '../components/ui/FilePreviewModal'

export default function SuratMasukDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [disposisiModal, setDisposisiModal] = useState(false)
  const [disposisiForm, setDisposisiForm] = useState({ penerimaIds: [], instruksi: '', catatan: '' })
  const [filePreviewOpen, setFilePreviewOpen] = useState(false)

  const { data: surat, isLoading } = useQuery({
    queryKey: ['surat-masuk-detail', id],
    queryFn: () => suratMasukAPI.getById(id).then(r => r.data.data),
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => userAPI.getByRole('').then(r => r.data.data),
    enabled: disposisiModal,
  })

  const disposisiMutation = useMutation({
    mutationFn: (data) => disposisiAPI.create(data),
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries(['surat-masuk-detail', id])
      setDisposisiModal(false)
      setDisposisiForm({ penerimaIds: [], instruksi: '', catatan: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat disposisi'),
  })

  const handleDisposisi = () => {
    if (disposisiForm.penerimaIds.length === 0) { toast.error('Pilih minimal satu penerima disposisi'); return }
    if (!disposisiForm.instruksi.trim()) { toast.error('Instruksi harus diisi'); return }
    disposisiMutation.mutate({ suratMasukId: id, ...disposisiForm })
  }

  const togglePenerima = (uid) => {
    setDisposisiForm(p => ({
      ...p,
      penerimaIds: p.penerimaIds.includes(uid)
        ? p.penerimaIds.filter(x => x !== uid)
        : [...p.penerimaIds, uid],
    }))
  }

  if (isLoading) return <PageLoader />
  if (!surat) return <div className="text-center py-20 text-gray-400">Surat tidak ditemukan</div>

  const canManage = ['ADMIN', 'SEKRETARIS', 'KETUA'].includes(user?.role)

  // Tentukan tipe file untuk preview
  const fileName = surat.filePath?.split('/').pop() || ''
  const fileExt  = fileName.split('.').pop()?.toLowerCase()
  const fileType = fileExt === 'pdf' ? 'application/pdf'
    : ['jpg','jpeg','png','webp'].includes(fileExt) ? `image/${fileExt}`
    : 'application/octet-stream'

  // URL file dengan token auth (via header interceptor axios, tapi untuk iframe/img kita pakai endpoint langsung)
  const fileUrl = surat.filePath ? suratMasukAPI.getFileUrl(id) : null

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">Detail Surat Masuk</h1>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link to={`/surat-masuk/edit/${id}`} className="btn-secondary">
              <PencilIcon className="w-4 h-4" /> Edit
            </Link>
            <button onClick={() => setDisposisiModal(true)} className="btn-primary">
              <ClipboardDocumentListIcon className="w-4 h-4" /> Disposisi
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Info */}
          <div className="card card-body">
            <h2 className="section-title mb-4">Informasi Surat</h2>
            <dl className="space-y-3">
              {[
                { label: 'Nomor Surat',    value: surat.nomorSurat || '—' },
                { label: 'Pengirim',       value: surat.pengirim },
                { label: 'Perihal',        value: surat.perihal },
                { label: 'Tanggal Surat',  value: formatDate(surat.tanggalSurat) },
                { label: 'Tanggal Terima', value: formatDate(surat.tanggalTerima) },
                { label: 'Diinput oleh',   value: surat.uploader?.namaLengkap },
              ].map(item => (
                <div key={item.label} className="flex gap-4">
                  <dt className="text-sm text-gray-500 w-36 flex-shrink-0">{item.label}</dt>
                  <dd className="text-sm font-medium text-gray-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Catatan */}
          {surat.isiSurat && (
            <div className="card card-body">
              <h2 className="section-title mb-3">Catatan</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{surat.isiSurat}</p>
            </div>
          )}

          {/* File Surat */}
          {surat.filePath && (
            <div className="card card-body">
              <h2 className="section-title mb-3">File Surat</h2>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <DocumentIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
                  <p className="text-xs text-gray-400 uppercase">{fileExt}</p>
                </div>
                <button
                  onClick={() => setFilePreviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <EyeIcon className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar disposisi */}
        <div className="space-y-5">
          <div className="card card-body">
            <h2 className="section-title mb-4">Riwayat Disposisi</h2>
            {surat.disposisi?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada disposisi</p>
            ) : (
              <div className="space-y-3">
                {surat.disposisi?.map((d) => (
                  <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-3.5 h-3.5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{d.penerima?.namaLengkap}</p>
                        <p className="text-xs text-gray-500">{d.penerima?.jabatan}</p>
                        <p className="text-xs text-gray-600 mt-1.5 bg-white rounded p-1.5 border border-gray-100">
                          {d.instruksi}
                        </p>
                        {d.catatan && (
                          <p className="text-xs text-gray-400 mt-1 italic">{d.catatan}</p>
                        )}
                        {/* Jawaban disposisi */}
                        {d.jawaban && (
                          <div className="mt-1.5 bg-green-50 border border-green-100 rounded p-1.5">
                            <p className="text-xs font-medium text-green-700 mb-0.5">Jawaban:</p>
                            <p className="text-xs text-green-800">{d.jawaban}</p>
                            <p className="text-xs text-green-500 mt-0.5">{formatDateTime(d.dijawabAt)}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-gray-400">{formatDateTime(d.createdAt)}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${d.sudahDibaca ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {d.sudahDibaca ? 'Dibaca' : 'Belum dibaca'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Disposisi */}
      <Modal isOpen={disposisiModal} onClose={() => setDisposisiModal(false)} title="Buat Disposisi" size="md">
        <div className="space-y-4">
          {/* Multi-penerima */}
          <div>
            <label className="label">
              Penerima Disposisi <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">
                {disposisiForm.penerimaIds.length > 0 ? `${disposisiForm.penerimaIds.length} dipilih` : 'Belum ada dipilih'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nonAdminIds = (allUsers || []).filter(u => u.role !== 'ADMIN').map(u => u.id)
                  const allSelected = nonAdminIds.every(id => disposisiForm.penerimaIds.includes(id))
                  setDisposisiForm(p => ({
                    ...p,
                    penerimaIds: allSelected
                      ? p.penerimaIds.filter(id => !nonAdminIds.includes(id))
                      : [...new Set([...p.penerimaIds, ...nonAdminIds])]
                  }))
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium underline"
              >
                {(allUsers || []).filter(u => u.role !== 'ADMIN').every(u => disposisiForm.penerimaIds.includes(u.id))
                  ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
              {allUsers?.map(u => {
                const selected = disposisiForm.penerimaIds.includes(u.id)
                return (
                  <label key={u.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${selected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${selected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                      {selected && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden"
                      checked={selected} onChange={() => togglePenerima(u.id)} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{u.namaLengkap}</p>
                      <p className="text-xs text-gray-400">{u.jabatan || u.role}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Instruksi <span className="text-red-500">*</span></label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Tulis instruksi disposisi..."
              value={disposisiForm.instruksi}
              onChange={e => setDisposisiForm(p => ({ ...p, instruksi: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea
              className="input-field min-h-[60px] resize-none"
              placeholder="Catatan tambahan..."
              value={disposisiForm.catatan}
              onChange={e => setDisposisiForm(p => ({ ...p, catatan: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDisposisiModal(false)} className="btn-secondary flex-1">Batal</button>
            <button
              onClick={handleDisposisi}
              disabled={disposisiMutation.isPending}
              className="btn-primary flex-1"
            >
              {disposisiMutation.isPending ? 'Menyimpan...' : 'Buat Disposisi'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Preview File */}
      {fileUrl && (
        <FilePreviewModal
          isOpen={filePreviewOpen}
          onClose={() => setFilePreviewOpen(false)}
          fileUrl={fileUrl}
          fileName={fileName}
          fileType={fileType}
        />
      )}
    </div>
  )
}
