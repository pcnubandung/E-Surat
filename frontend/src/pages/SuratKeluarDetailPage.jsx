import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon, PencilIcon, ArrowDownTrayIcon,
  CheckCircleIcon, XCircleIcon, PaperAirplaneIcon,
  QrCodeIcon, ExclamationTriangleIcon, EyeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { suratKeluarAPI, getUploadUrl } from '../services/api'
import useAuthStore from '../store/authStore'
import { getStatusLabel, getStatusClass, formatDate, formatDateTime, downloadBlob } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import PDFPreviewModal from '../components/ui/PDFPreviewModal'
import RichTextEditor from '../components/editor/RichTextEditor'

export default function SuratKeluarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [tolakModal, setTolakModal] = useState(false)
  const [catatanTolak, setCatatanTolak] = useState('')
  const [kirimModal, setKirimModal] = useState(false)
  const [previewModal, setPreviewModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['surat-keluar-detail', id],
    queryFn: () => suratKeluarAPI.getById(id).then(r => r.data.data),
  })

  const kirimMutation = useMutation({
    mutationFn: () => suratKeluarAPI.kirim(id),
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries(['surat-keluar-detail', id])
      queryClient.invalidateQueries(['surat-keluar'])
      setKirimModal(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengirim surat'),
  })

  const ttdMutation = useMutation({
    mutationFn: () => suratKeluarAPI.tandaTangan(id),
    onSuccess: (res) => {
      toast.success('Surat berhasil ditandatangani!')
      queryClient.invalidateQueries(['surat-keluar-detail', id])
      queryClient.invalidateQueries(['surat-keluar'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menandatangani'),
  })

  const tolakMutation = useMutation({
    mutationFn: () => suratKeluarAPI.tolak(id, { catatan: catatanTolak }),
    onSuccess: (res) => {
      toast.success('Surat berhasil ditolak')
      queryClient.invalidateQueries(['surat-keluar-detail', id])
      queryClient.invalidateQueries(['surat-keluar'])
      setTolakModal(false)
      setCatatanTolak('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menolak surat'),
  })

  const downloadMutation = useMutation({
    mutationFn: () => suratKeluarAPI.downloadPDF(id),
    onSuccess: (res) => {
      const filename = `Surat-${surat?.nomorSurat?.replace(/\//g, '-') || id}.pdf`
      downloadBlob(res.data, filename)
      toast.success('PDF berhasil diunduh')
    },
    onError: async (err) => {
      let msg = 'Gagal mengunduh PDF'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          msg = JSON.parse(text)?.message || msg
        } catch (_) {}
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      toast.error(msg)
    },
  })

  if (isLoading) return <PageLoader />

  const surat = data
  if (!surat) return <div className="text-center py-20 text-gray-400">Surat tidak ditemukan</div>

  const canSign = (
    (user?.role === 'SEKRETARIS' && surat.status === 'MENUNGGU_SEKRETARIS' && surat.sekretarisId === user.id) ||
    (user?.role === 'KETUA' && surat.status === 'MENUNGGU_KETUA' && surat.ketuaId === user.id)
  )

  const canReject = canSign

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Detail Surat Keluar</h1>
            <span className={getStatusClass(surat.status)}>{getStatusLabel(surat.status)}</span>
          </div>
          {surat.nomorSurat && (
            <p className="text-sm text-gray-500 font-mono mt-0.5">{surat.nomorSurat}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol Preview PDF — tersedia untuk semua status kecuali DRAFT */}
          {surat.status !== 'DRAFT' && (
            <button
              onClick={() => setPreviewModal(true)}
              className="btn-secondary"
              title="Preview PDF Surat"
            >
              <EyeIcon className="w-4 h-4" /> Preview PDF
            </button>
          )}
          {user?.role === 'ADMIN' && ['DRAFT', 'DITOLAK_SEKRETARIS', 'DITOLAK_KETUA'].includes(surat.status) && (
            <Link to={`/surat-keluar/edit/${id}`} className="btn-secondary">
              <PencilIcon className="w-4 h-4" /> Edit
            </Link>
          )}
          {user?.role === 'ADMIN' && surat.status === 'DRAFT' && (
            <button onClick={() => setKirimModal(true)} className="btn-primary">
              <PaperAirplaneIcon className="w-4 h-4" /> Kirim
            </button>
          )}
          {surat.status === 'SELESAI' && (
            <button onClick={() => downloadMutation.mutate()} disabled={downloadMutation.isPending} className="btn-primary">
              <ArrowDownTrayIcon className="w-4 h-4" />
              {downloadMutation.isPending ? 'Mengunduh...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Catatan tolak */}
      {surat.catatanTolak && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Surat Ditolak oleh {surat.ditolakOleh}</p>
              <p className="text-sm text-red-600 mt-1">{surat.catatanTolak}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info surat */}
          <div className="card card-body">
            <h2 className="section-title mb-4">Informasi Surat</h2>
            <dl className="space-y-3">
              {[
                { label: 'Perihal', value: surat.perihal },
                { label: 'Tanggal', value: `${formatDate(surat.tanggalMasehi)} / ${surat.tanggalHijriyah}` },
                { label: 'Dibuat oleh', value: surat.pembuat?.namaLengkap },
                { label: 'Penerima Eksternal', value: surat.penerimaEksternal || '—' },
                surat.penerimaInternal?.length > 0 && {
                  label: 'Penerima Internal',
                  value: surat.penerimaInternal.map(p => p.user?.namaLengkap).join(', ')
                },
              ].filter(Boolean).map(item => (
                <div key={item.label} className="flex gap-4">
                  <dt className="text-sm text-gray-500 w-36 flex-shrink-0">{item.label}</dt>
                  <dd className="text-sm font-medium text-gray-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Isi surat */}
          <div className="card card-body">
            <h2 className="section-title mb-4">Isi Surat</h2>
            <RichTextEditor value={surat.isiSurat} readOnly />
          </div>

          {/* Lampiran */}
          {surat.lampiran && surat.lampiran !== '<p></p>' && (
            <div className="card card-body">
              <h2 className="section-title mb-4">Lampiran</h2>
              <RichTextEditor value={surat.lampiran} readOnly />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Alur tanda tangan */}
          <div className="card card-body">
            <h2 className="section-title mb-4">Alur Penandatanganan</h2>
            <div className="space-y-4">
              {/* Sekretaris */}
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  surat.ttdSekretaris ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {surat.ttdSekretaris
                    ? <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    : <span className="text-gray-400 text-xs font-bold">1</span>
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {surat.sekretaris?.namaLengkap || 'Sekretaris belum dipilih'}
                  </p>
                  <p className="text-xs text-gray-400">{surat.sekretaris?.jabatan || 'Sekretaris'}</p>
                  {surat.tglTtdSekretaris && (
                    <p className="text-xs text-green-600 mt-0.5">✓ {formatDateTime(surat.tglTtdSekretaris)}</p>
                  )}
                </div>
              </div>

              <div className="w-px h-4 bg-gray-200 ml-4" />

              {/* Ketua */}
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  surat.ttdKetua ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {surat.ttdKetua
                    ? <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    : <span className="text-gray-400 text-xs font-bold">2</span>
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {surat.ketua?.namaLengkap || 'Ketua belum dipilih'}
                  </p>
                  <p className="text-xs text-gray-400">{surat.ketua?.jabatan || 'Ketua'}</p>
                  {surat.tglTtdKetua && (
                    <p className="text-xs text-green-600 mt-0.5">✓ {formatDateTime(surat.tglTtdKetua)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {surat.status === 'SELESAI' && surat.qrCodeToken && (
            <div className="card card-body text-center">
              <h2 className="section-title mb-3">Verifikasi QR Code</h2>
              <img
                src={getUploadUrl(surat.qrCodePath)}
                alt="QR Code Verifikasi"
                className="w-32 h-32 mx-auto rounded-lg border border-gray-100"
              />
              <p className="text-xs text-gray-400 mt-2">Scan untuk verifikasi keaslian dokumen</p>
              <Link
                to={`/verifikasi/${surat.qrCodeToken}`}
                target="_blank"
                className="btn-secondary w-full justify-center mt-3 text-xs"
              >
                <QrCodeIcon className="w-4 h-4" /> Buka Halaman Verifikasi
              </Link>
            </div>
          )}

          {/* Action buttons untuk penandatangan */}
          {canSign && (
            <div className="card card-body space-y-3">
              <h2 className="section-title">Tindakan</h2>
              <button
                onClick={() => setPreviewModal(true)}
                className="btn-secondary w-full justify-center"
              >
                <EyeIcon className="w-4 h-4" /> Preview PDF Surat
              </button>
              <button
                onClick={() => ttdMutation.mutate()}
                disabled={ttdMutation.isPending}
                className="btn-primary w-full justify-center"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {ttdMutation.isPending ? 'Memproses...' : 'Tandatangani Surat'}
              </button>
              <button
                onClick={() => setTolakModal(true)}
                className="btn-danger w-full justify-center"
              >
                <XCircleIcon className="w-4 h-4" /> Tolak Surat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Kirim */}
      <Modal isOpen={kirimModal} onClose={() => setKirimModal(false)} title="Kirim Surat ke Sekretaris" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Surat akan dikirim ke sekretaris untuk ditandatangani. Pastikan semua informasi sudah benar.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setKirimModal(false)} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => kirimMutation.mutate()}
            disabled={kirimMutation.isPending}
            className="btn-primary flex-1"
          >
            {kirimMutation.isPending ? 'Mengirim...' : 'Kirim Sekarang'}
          </button>
        </div>
      </Modal>

      {/* Modal Tolak */}
      <Modal isOpen={tolakModal} onClose={() => setTolakModal(false)} title="Tolak Surat" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Berikan catatan perbaikan untuk admin:</p>
          <textarea
            className="input-field min-h-[100px] resize-none"
            placeholder="Tulis catatan perbaikan..."
            value={catatanTolak}
            onChange={e => setCatatanTolak(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={() => setTolakModal(false)} className="btn-secondary flex-1">Batal</button>
            <button
              onClick={() => tolakMutation.mutate()}
              disabled={tolakMutation.isPending || !catatanTolak.trim()}
              className="btn-danger flex-1"
            >
              {tolakMutation.isPending ? 'Memproses...' : 'Tolak Surat'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Preview PDF */}
      <PDFPreviewModal
        isOpen={previewModal}
        onClose={() => setPreviewModal(false)}
        suratId={id}
        nomorSurat={surat?.nomorSurat}
      />
    </div>
  )
}
