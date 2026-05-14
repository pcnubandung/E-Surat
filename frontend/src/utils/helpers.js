import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export const formatDate = (date, fmt = 'dd MMMM yyyy') => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: id })
  } catch {
    return '-'
  }
}

export const formatDateTime = (date) => {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export const getStatusLabel = (status) => {
  const labels = {
    DRAFT: 'Draft',
    MENUNGGU_SEKRETARIS: 'Menunggu Sekretaris',
    MENUNGGU_KETUA: 'Menunggu Ketua',
    DITOLAK_SEKRETARIS: 'Ditolak Sekretaris',
    DITOLAK_KETUA: 'Ditolak Ketua',
    SELESAI: 'Selesai',
    BARU: 'Baru',
    DIBACA: 'Dibaca',
    DIDISPOSISI: 'Didisposisi',
  }
  return labels[status] || status
}

export const getStatusClass = (status) => {
  const classes = {
    DRAFT: 'status-draft',
    MENUNGGU_SEKRETARIS: 'status-menunggu',
    MENUNGGU_KETUA: 'status-menunggu',
    DITOLAK_SEKRETARIS: 'status-ditolak',
    DITOLAK_KETUA: 'status-ditolak',
    SELESAI: 'status-selesai',
    BARU: 'badge bg-blue-100 text-blue-800',
    DIBACA: 'badge bg-gray-100 text-gray-700',
    DIDISPOSISI: 'badge bg-purple-100 text-purple-800',
  }
  return classes[status] || 'badge bg-gray-100 text-gray-700'
}

export const getRoleLabel = (role) => {
  const labels = {
    ADMIN: 'Admin',
    SEKRETARIS: 'Sekretaris',
    KETUA: 'Ketua',
    PENGURUS: 'Pengurus',
  }
  return labels[role] || role
}

export const getRoleColor = (role) => {
  const colors = {
    ADMIN: 'bg-purple-100 text-purple-800',
    SEKRETARIS: 'bg-blue-100 text-blue-800',
    KETUA: 'bg-primary-100 text-primary-800',
    PENGURUS: 'bg-gray-100 text-gray-700',
  }
  return colors[role] || 'bg-gray-100 text-gray-700'
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export const truncate = (str, n = 50) => {
  if (!str) return ''
  return str.length > n ? str.substring(0, n) + '...' : str
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export const buatSingkatan = (tingkatan = '', namaOrg = '') => {
  const st = tingkatan.split(' ').map(w => w[0]?.toUpperCase() || '').join('')
  const sn = namaOrg.split(' ').map(w => w[0]?.toUpperCase() || '').join('')
  return `${st}-${sn}`
}

export const JENIS_SURAT_OPTIONS = [
  { value: 'A',  label: 'A — Surat Rutin Internal' },
  { value: 'B',  label: 'B — Surat Rutin Eksternal' },
  { value: 'C',  label: 'C — Surat Keterangan' },
  { value: 'D',  label: 'D — Surat Rekomendasi' },
  { value: 'E',  label: 'E — Surat Tugas' },
  { value: 'F',  label: 'F — Surat Mandat' },
  { value: 'G',  label: 'G — Surat Instruksi' },
  { value: 'H',  label: 'H — Surat Pengumuman' },
  { value: 'I',  label: 'I — Surat Edaran' },
  { value: 'J',  label: 'J — Surat Peringatan' },
  { value: 'K',  label: 'K — Surat Pernyataan' },
  { value: 'SK', label: 'SK — Surat Keputusan' },
]
