import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardDocumentListIcon, EyeIcon, DocumentIcon,
  ChatBubbleLeftEllipsisIcon, CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { disposisiAPI, suratMasukAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { formatDateTime } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import FilePreviewModal from '../components/ui/FilePreviewModal'

export default function DisposisiPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [jawabModal, setJawabModal] = useState(null)   // disposisi object
  const [jawaban, setJawaban] = useState('')
  const [filePreview, setFilePreview] = useState(null) // { fileUrl, fileName, fileType }

  const { data, isLoading } = useQuery({
    queryKey: ['my-disposisi'],
    queryFn: () => disposisiAPI.getMy().then(r => r.data.data),
  })

  const bacaMutation = useMutation({
    mutationFn: (id) => disposisiAPI.tandaiDibaca(id),
    onSuccess: () => queryClient.invalidateQueries(['my-disposisi']),
  })

  const jawabMutation = useMutation({
    mutationFn: ({ id, jawaban }) => disposisiAPI.jawab(id, { jawaban }),
    onSuccess: () => {
      toast.success('Jawaban berhasil dikirim')
      queryClient.invalidateQueries(['my-disposisi'])
      setJawabModal(null)
      setJawaban('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengirim jawaban'),
  })

  const handlePreviewFile = (d) => {
    if (!d.suratMasuk?.filePath && !d.suratMasukId) return
    const suratId = d.suratMasukId
    const filePath = d.suratMasuk?.filePath || ''
    const fileName = filePath.split('/').pop() || 'file'
    const fileExt  = fileName.split('.').pop()?.toLowerCase()
    const fileType = fileExt === 'pdf' ? 'application/pdf'
      : ['jpg','jpeg','png','webp'].includes(fileExt) ? `image/${fileExt}`
      : 'application/octet-stream'

    setFilePreview({
      fileUrl: suratMasukAPI.getFileUrl(suratId),
      fileName,
      fileType,
    })
  }

  const disposisiList = data || []
  const unread = disposisiList.filter(d => !d.sudahDibaca).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Disposisi Surat</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Disposisi yang ditujukan kepada Anda
            {unread > 0 && (
              <span className="ml-2 badge bg-red-100 text-red-700">{unread} belum dibaca</span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : disposisiList.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardDocumentListIcon}
            title="Belum ada disposisi"
            description="Disposisi surat yang ditujukan kepada Anda akan muncul di sini"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {disposisiList.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-5 ${!d.sudahDibaca ? 'border-l-4 border-l-primary-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  d.sudahDibaca ? 'bg-gray-100' : 'bg-primary-100'
                }`}>
                  <ClipboardDocumentListIcon className={`w-5 h-5 ${d.sudahDibaca ? 'text-gray-400' : 'text-primary-600'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {d.suratMasuk?.perihal || 'Surat Masuk'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dari: {d.suratMasuk?.pengirim} · No: {d.suratMasuk?.nomorSurat || '—'}
                      </p>
                    </div>
                    {!d.sudahDibaca && (
                      <span className="badge bg-primary-100 text-primary-700 flex-shrink-0">Baru</span>
                    )}
                  </div>

                  {/* Instruksi */}
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Instruksi dari {d.dibuatOleh?.namaLengkap}:
                    </p>
                    <p className="text-sm text-gray-800">{d.instruksi}</p>
                    {d.catatan && (
                      <p className="text-xs text-gray-500 mt-1 italic">Catatan: {d.catatan}</p>
                    )}
                  </div>

                  {/* Jawaban yang sudah ada */}
                  {d.jawaban && (
                    <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-medium text-green-700">Jawaban Anda:</p>
                      </div>
                      <p className="text-sm text-green-800">{d.jawaban}</p>
                      <p className="text-xs text-green-500 mt-1">{formatDateTime(d.dijawabAt)}</p>
                    </div>
                  )}

                  {/* Tombol aksi */}
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <p className="text-xs text-gray-400">{formatDateTime(d.createdAt)}</p>
                    <div className="flex gap-2 flex-wrap">
                      {!d.sudahDibaca && (
                        <button
                          onClick={() => bacaMutation.mutate(d.id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Tandai Dibaca
                        </button>
                      )}

                      {/* Preview file surat */}
                      {d.suratMasuk?.filePath && (
                        <button
                          onClick={() => handlePreviewFile(d)}
                          className="btn-secondary text-xs py-1 px-3"
                        >
                          <DocumentIcon className="w-3.5 h-3.5" /> Lihat File Surat
                        </button>
                      )}

                      {/* Jawab disposisi */}
                      {!d.jawaban && (
                        <button
                          onClick={() => {
                            setJawabModal(d)
                            setJawaban('')
                            if (!d.sudahDibaca) bacaMutation.mutate(d.id)
                          }}
                          className="btn-secondary text-xs py-1 px-3"
                        >
                          <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5" /> Jawab
                        </button>
                      )}
                      {d.jawaban && (
                        <button
                          onClick={() => {
                            setJawabModal(d)
                            setJawaban(d.jawaban)
                          }}
                          className="btn-secondary text-xs py-1 px-3"
                        >
                          <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5" /> Edit Jawaban
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Jawab Disposisi */}
      <Modal
        isOpen={!!jawabModal}
        onClose={() => { setJawabModal(null); setJawaban('') }}
        title="Jawab Disposisi"
        size="sm"
      >
        <div className="space-y-4">
          {jawabModal && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Instruksi:</p>
              <p>{jawabModal.instruksi}</p>
            </div>
          )}
          <div>
            <label className="label">Jawaban / Laporan <span className="text-red-500">*</span></label>
            <textarea
              className="input-field min-h-[120px] resize-none"
              placeholder="Tulis jawaban atau laporan tindak lanjut Anda..."
              value={jawaban}
              onChange={e => setJawaban(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setJawabModal(null); setJawaban('') }}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              onClick={() => jawabMutation.mutate({ id: jawabModal.id, jawaban })}
              disabled={jawabMutation.isPending || !jawaban.trim()}
              className="btn-primary flex-1"
            >
              {jawabMutation.isPending ? 'Mengirim...' : 'Kirim Jawaban'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Preview File */}
      {filePreview && (
        <FilePreviewModal
          isOpen={!!filePreview}
          onClose={() => setFilePreview(null)}
          fileUrl={filePreview.fileUrl}
          fileName={filePreview.fileName}
          fileType={filePreview.fileType}
        />
      )}
    </div>
  )
}
