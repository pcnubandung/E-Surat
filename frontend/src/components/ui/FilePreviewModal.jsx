import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

/**
 * FilePreviewModal
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - fileUrl: string   — URL endpoint file (dengan token)
 *  - fileName: string  — nama file awal (bisa tanpa ekstensi)
 *  - fileType: string  — mime type awal (opsional, akan di-override dari response header)
 */
export default function FilePreviewModal({ isOpen, onClose, fileUrl, fileName, fileType: fileTypeProp }) {
  const [blobUrl, setBlobUrl]     = useState(null)
  const [mimeType, setMimeType]   = useState(null)
  const [realName, setRealName]   = useState(fileName || 'file')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!isOpen || !fileUrl) return

    let objectUrl = null
    setLoading(true)
    setError(null)
    setBlobUrl(null)
    setMimeType(null)

    fetch(fileUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)

        // Ambil mime type dari Content-Type header
        const ct = res.headers.get('Content-Type') || ''
        const mime = ct.split(';')[0].trim()
        setMimeType(mime)

        // Ambil nama file dari header X-File-Name atau Content-Disposition
        const xName = res.headers.get('X-File-Name')
        const cd    = res.headers.get('Content-Disposition') || ''
        const cdMatch = cd.match(/filename="?([^";\n]+)"?/i)
        const detectedName = xName || cdMatch?.[1] || fileName || 'file'
        setRealName(detectedName)

        return res.blob().then(blob => ({ blob, mime }))
      })
      .then(({ blob, mime }) => {
        objectUrl = URL.createObjectURL(new Blob([blob], { type: mime }))
        setBlobUrl(objectUrl)
      })
      .catch(err => {
        console.error('FilePreview fetch error:', err)
        setError('Gagal memuat file. Coba unduh langsung.')
      })
      .finally(() => setLoading(false))

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isOpen, fileUrl])

  // Cleanup saat modal ditutup
  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setMimeType(null)
    setError(null)
    onClose()
  }

  const isPdf   = mimeType === 'application/pdf'
  const isImage = mimeType?.startsWith('image/')

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = realName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex flex-col p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="flex flex-col w-full max-w-4xl mx-auto h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <DocumentIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <Dialog.Title className="text-base font-semibold text-gray-900 truncate">
                    {realName}
                  </Dialog.Title>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {blobUrl && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Unduh
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
              <div className="flex-1 bg-gray-100 overflow-hidden flex items-center justify-center">
                {loading && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Memuat file...</p>
                  </div>
                )}

                {error && !loading && (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <DocumentIcon className="w-16 h-16 text-gray-300" />
                    <p className="text-gray-500 text-sm">{error}</p>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      <ArrowDownTrayIcon className="w-4 h-4" /> Unduh File
                    </a>
                  </div>
                )}

                {blobUrl && !loading && isPdf && (
                  <iframe
                    src={blobUrl}
                    className="w-full h-full border-0"
                    title="Preview PDF"
                  />
                )}

                {blobUrl && !loading && isImage && (
                  <img
                    src={blobUrl}
                    alt={realName}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                )}

                {blobUrl && !loading && !isPdf && !isImage && (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <DocumentIcon className="w-16 h-16 text-gray-300" />
                    <p className="text-gray-500 text-sm">
                      File ini tidak dapat ditampilkan langsung di browser.
                    </p>
                    <button onClick={handleDownload} className="btn-primary">
                      <ArrowDownTrayIcon className="w-4 h-4" /> Unduh File
                    </button>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
