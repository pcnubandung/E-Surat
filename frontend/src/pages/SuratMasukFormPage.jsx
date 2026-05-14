import { useState, useEffect, useRef, Fragment } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, Transition } from '@headlessui/react'
import {
  ArrowLeftIcon, PaperClipIcon, CameraIcon,
  XMarkIcon, DocumentIcon, ArrowPathIcon, CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { suratMasukAPI } from '../services/api'

// ── Komponen modal kamera ─────────────────────────────────────────────────────
function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' = belakang, 'user' = depan
  const [ready, setReady]           = useState(false)
  const [captured, setCaptured]     = useState(null) // data URL hasil foto

  const startCamera = async (mode) => {
    // Hentikan stream lama jika ada
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setReady(false)
    setCaptured(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setReady(true)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.')
      onClose()
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setReady(false)
    setCaptured(null)
  }

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode)
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen])

  const handleFlip = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    startCamera(newMode)
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCaptured(dataUrl)
  }

  const handleRetake = () => {
    setCaptured(null)
  }

  const handleUse = () => {
    if (!captured) return
    // Konversi data URL ke File
    fetch(captured)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], `foto-surat-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file, captured)
        stopCamera()
        onClose()
      })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { stopCamera(); onClose() }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex flex-col">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="flex flex-col w-full max-w-2xl mx-auto my-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
                <Dialog.Title className="text-white font-semibold text-sm">
                  {captured ? 'Hasil Foto' : 'Ambil Foto Surat'}
                </Dialog.Title>
                <button
                  onClick={() => { stopCamera(); onClose() }}
                  className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Viewfinder / Preview */}
              <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
                {/* Video live */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${captured ? 'hidden' : ''}`}
                />
                {/* Canvas tersembunyi untuk capture */}
                <canvas ref={canvasRef} className="hidden" />
                {/* Hasil foto */}
                {captured && (
                  <img src={captured} alt="Hasil foto" className="w-full h-full object-contain bg-black" />
                )}
                {/* Loading indicator */}
                {!ready && !captured && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Kontrol */}
              <div className="flex items-center justify-center gap-6 px-6 py-5 bg-gray-900">
                {!captured ? (
                  <>
                    {/* Flip kamera */}
                    <button
                      type="button"
                      onClick={handleFlip}
                      className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
                      title="Ganti kamera"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>

                    {/* Tombol ambil foto */}
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={!ready}
                      className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center shadow-lg transition-colors"
                      title="Ambil foto"
                    >
                      <div className="w-12 h-12 rounded-full border-4 border-gray-400" />
                    </button>

                    {/* Spacer */}
                    <div className="w-10" />
                  </>
                ) : (
                  <>
                    {/* Ulangi */}
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
                    >
                      <ArrowPathIcon className="w-4 h-4" /> Ulangi
                    </button>

                    {/* Gunakan foto */}
                    <button
                      type="button"
                      onClick={handleUse}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" /> Gunakan Foto
                    </button>
                  </>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

// ── Halaman Form Surat Masuk ──────────────────────────────────────────────────
export default function SuratMasukFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    nomorSurat: '',
    pengirim: '',
    perihal: '',
    catatan: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tanggalTerima: new Date().toISOString().split('T')[0],
  })
  const [file, setFile]             = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [cameraOpen, setCameraOpen]   = useState(false)

  const { data: existing } = useQuery({
    queryKey: ['surat-masuk-detail', id],
    queryFn: () => suratMasukAPI.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        nomorSurat:    existing.nomorSurat    || '',
        pengirim:      existing.pengirim      || '',
        perihal:       existing.perihal       || '',
        catatan:       existing.isiSurat      || '',
        tanggalSurat:  existing.tanggalSurat?.split('T')[0]  || '',
        tanggalTerima: existing.tanggalTerima?.split('T')[0] || '',
      })
    }
  }, [existing])

  const saveMutation = useMutation({
    mutationFn: (formData) => isEdit
      ? suratMasukAPI.update(id, formData)
      : suratMasukAPI.create(formData),
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries(['surat-masuk'])
      navigate('/surat-masuk')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  })

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    applyFile(f, f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  const applyFile = (f, previewUrl) => {
    setFile(f)
    if (f.type.startsWith('image/')) {
      setFilePreview({ type: 'image', url: previewUrl || URL.createObjectURL(f), name: f.name })
    } else {
      setFilePreview({ type: 'file', name: f.name })
    }
  }

  const clearFile = () => {
    setFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCameraCapture = (capturedFile, dataUrl) => {
    applyFile(capturedFile, dataUrl)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.pengirim.trim()) { toast.error('Pengirim harus diisi'); return }
    if (!form.perihal.trim())  { toast.error('Perihal harus diisi'); return }
    if (!form.tanggalSurat)    { toast.error('Tanggal surat harus diisi'); return }

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
    if (file) formData.append('file', file)

    saveMutation.mutate(formData)
  }

  const existingFileName = existing?.filePath?.split('/').pop()

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Surat Masuk' : 'Tambah Surat Masuk'}</h1>
          <p className="text-sm text-gray-500">Isi data surat masuk</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Informasi Surat */}
        <div className="card card-body space-y-4">
          <h2 className="section-title">Informasi Surat</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nomor Surat</label>
              <input type="text" className="input-field" placeholder="Nomor surat (opsional)"
                value={form.nomorSurat} onChange={e => setForm(p => ({ ...p, nomorSurat: e.target.value }))} />
            </div>
            <div>
              <label className="label">Pengirim <span className="text-red-500">*</span></label>
              <input type="text" className="input-field" placeholder="Nama/instansi pengirim"
                value={form.pengirim} onChange={e => setForm(p => ({ ...p, pengirim: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Perihal <span className="text-red-500">*</span></label>
            <input type="text" className="input-field" placeholder="Perihal surat"
              value={form.perihal} onChange={e => setForm(p => ({ ...p, perihal: e.target.value }))} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Surat <span className="text-red-500">*</span></label>
              <input type="date" className="input-field"
                value={form.tanggalSurat} onChange={e => setForm(p => ({ ...p, tanggalSurat: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Tanggal Diterima</label>
              <input type="date" className="input-field"
                value={form.tanggalTerima} onChange={e => setForm(p => ({ ...p, tanggalTerima: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="card card-body space-y-3">
          <h2 className="section-title">Catatan</h2>
          <textarea
            className="input-field min-h-[100px] resize-none"
            placeholder="Catatan tambahan tentang surat ini (opsional)..."
            value={form.catatan}
            onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))}
          />
        </div>

        {/* Upload File */}
        <div className="card card-body space-y-4">
          <h2 className="section-title">File Surat</h2>
          <p className="text-xs text-gray-400">Upload file surat (PDF, Word, atau foto). Bisa menggunakan kamera untuk foto langsung.</p>

          {/* Preview file yang dipilih */}
          {filePreview ? (
            <div className="relative border border-gray-200 rounded-xl overflow-hidden">
              {filePreview.type === 'image' ? (
                <img src={filePreview.url} alt="Preview" className="w-full max-h-64 object-contain bg-gray-50" />
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50">
                  <DocumentIcon className="w-8 h-8 text-primary-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{filePreview.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : existing?.filePath && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <DocumentIcon className="w-6 h-6 text-primary-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{existingFileName}</p>
                <p className="text-xs text-gray-400">File saat ini</p>
              </div>
            </div>
          )}

          {/* Tombol upload */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 rounded-xl text-sm text-gray-600 hover:text-primary-700 transition-colors"
            >
              <PaperClipIcon className="w-5 h-5" />
              Pilih File
            </button>

            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 rounded-xl text-sm text-gray-600 hover:text-primary-700 transition-colors"
            >
              <CameraIcon className="w-5 h-5" />
              Foto Kamera
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <p className="text-xs text-gray-400">Format: PDF, Word, JPG, PNG, WebP. Maks 10MB.</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Surat Masuk'}
          </button>
        </div>
      </form>

      {/* Modal Kamera */}
      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
