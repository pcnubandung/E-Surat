import { useEffect, useState, useCallback } from 'react'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { suratKeluarAPI } from '../../services/api'
import { downloadBlob } from '../../utils/helpers'
import toast from 'react-hot-toast'

/**
 * PDFPreviewModal
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - suratId: string  — ID surat yang akan di-preview
 *  - nomorSurat: string — untuk nama file saat download
 */
export default function PDFPreviewModal({ isOpen, onClose, suratId, nomorSurat }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadPreview = useCallback(async () => {
    if (!suratId) return
    setLoading(true)
    setError(null)
    try {
      const res = await suratKeluarAPI.previewPDF(suratId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      let msg = 'Gagal memuat preview PDF'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          msg = JSON.parse(text)?.message || msg
        } catch (_) {}
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [suratId])

  // Load PDF saat modal dibuka
  useEffect(() => {
    if (isOpen && suratId) {
      loadPreview()
    }
    // Cleanup URL object saat modal ditutup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
    }
  }, [isOpen, suratId])

  const handleDownload = () => {
    if (!pdfUrl) return
    fetch(pdfUrl)
      .then(r => r.blob())
      .then(blob => {
        const filename = `Surat-${(nomorSurat || suratId).replace(/\//g, '-')}.pdf`
        downloadBlob(blob, filename)
        toast.success('PDF berhasil diunduh')
      })
  }

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setError(null)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex flex-col p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="flex flex-col w-full max-w-5xl mx-auto h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                  <Dialog.Title className="text-base font-semibold text-gray-900">
                    Preview Surat
                    {nomorSurat && (
                      <span className="ml-2 text-sm font-mono text-gray-400">{nomorSurat}</span>
                    )}
                  </Dialog.Title>
                </div>
                <div className="flex items-center gap-2">
                  {pdfUrl && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Unduh PDF
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 bg-gray-100 overflow-hidden">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Memuat preview surat...</p>
                  </div>
                )}

                {error && !loading && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                      <XMarkIcon className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{error}</p>
                    <button
                      onClick={loadPreview}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                {pdfUrl && !loading && (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title="Preview Surat PDF"
                  />
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
