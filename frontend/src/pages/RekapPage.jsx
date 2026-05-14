import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  DocumentArrowDownIcon, TableCellsIcon,
  DocumentTextIcon, FunnelIcon, ArrowPathIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { rekapAPI } from '../services/api'
import { downloadBlob, formatDate, getStatusLabel, getStatusClass } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import StatsCard from '../components/ui/StatsCard'

const STATUS_KELUAR = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_SEKRETARIS', label: 'Menunggu Sekretaris' },
  { value: 'MENUNGGU_KETUA', label: 'Menunggu Ketua' },
  { value: 'DITOLAK_SEKRETARIS', label: 'Ditolak Sekretaris' },
  { value: 'DITOLAK_KETUA', label: 'Ditolak Ketua' },
  { value: 'SELESAI', label: 'Selesai' },
]
const STATUS_MASUK = [
  { value: '', label: 'Semua Status' },
  { value: 'BARU', label: 'Baru' },
  { value: 'DIBACA', label: 'Dibaca' },
  { value: 'DIDISPOSISI', label: 'Didisposisi' },
]

export default function RekapPage() {
  const [jenis, setJenis]         = useState('keluar')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [status, setStatus]       = useState('')
  const [applied, setApplied]     = useState({ jenis: 'keluar', startDate: '', endDate: '', status: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rekap', applied],
    queryFn: () => rekapAPI.getData({
      jenis: applied.jenis,
      startDate: applied.startDate || undefined,
      endDate: applied.endDate || undefined,
      status: applied.status || undefined,
    }).then(r => r.data),
    staleTime: 0,
  })

  const excelMutation = useMutation({
    mutationFn: () => rekapAPI.exportExcel({
      jenis: applied.jenis,
      startDate: applied.startDate || undefined,
      endDate: applied.endDate || undefined,
      status: applied.status || undefined,
    }),
    onSuccess: (res) => {
      const label = applied.jenis === 'keluar' ? 'Surat-Keluar' : 'Surat-Masuk'
      const tgl   = new Date().toISOString().split('T')[0]
      downloadBlob(res.data, `Rekap-${label}-${tgl}.xlsx`)
      toast.success('File Excel berhasil diunduh')
    },
    onError: () => toast.error('Gagal mengunduh Excel'),
  })

  const pdfMutation = useMutation({
    mutationFn: () => rekapAPI.exportPDF({
      jenis: applied.jenis,
      startDate: applied.startDate || undefined,
      endDate: applied.endDate || undefined,
      status: applied.status || undefined,
    }),
    onSuccess: (res) => {
      const label = applied.jenis === 'keluar' ? 'Surat-Keluar' : 'Surat-Masuk'
      const tgl   = new Date().toISOString().split('T')[0]
      downloadBlob(res.data, `Rekap-${label}-${tgl}.pdf`)
      toast.success('File PDF berhasil diunduh')
    },
    onError: () => toast.error('Gagal mengunduh PDF'),
  })

  const handleApply = () => {
    setApplied({ jenis, startDate, endDate, status })
  }

  const handleReset = () => {
    setJenis('keluar'); setStartDate(''); setEndDate(''); setStatus('')
    setApplied({ jenis: 'keluar', startDate: '', endDate: '', status: '' })
  }

  const list       = data?.data || []
  const statistik  = data?.statistik || {}
  const isKeluar   = applied.jenis === 'keluar'
  const statusOpts = isKeluar ? STATUS_KELUAR : STATUS_MASUK

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Rekap Surat</h1>
          <p className="text-sm text-gray-500 mt-0.5">Laporan dan rekap data surat keluar & masuk</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => excelMutation.mutate()}
            disabled={excelMutation.isPending || list.length === 0}
            className="btn-secondary"
          >
            <TableCellsIcon className="w-4 h-4 text-green-600" />
            {excelMutation.isPending ? 'Mengunduh...' : 'Excel'}
          </button>
          <button
            onClick={() => pdfMutation.mutate()}
            disabled={pdfMutation.isPending || list.length === 0}
            className="btn-secondary"
          >
            <DocumentArrowDownIcon className="w-4 h-4 text-red-600" />
            {pdfMutation.isPending ? 'Mengunduh...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FunnelIcon className="w-4 h-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-gray-700">Filter Rekap</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Jenis */}
          <div>
            <label className="label">Jenis Surat</label>
            <select className="input-field" value={jenis} onChange={e => { setJenis(e.target.value); setStatus('') }}>
              <option value="keluar">Surat Keluar</option>
              <option value="masuk">Surat Masuk</option>
            </select>
          </div>
          {/* Tanggal mulai */}
          <div>
            <label className="label">Tanggal Mulai</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          {/* Tanggal akhir */}
          <div>
            <label className="label">Tanggal Akhir</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
              {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleApply} className="btn-primary">
            <ArrowPathIcon className="w-4 h-4" /> Tampilkan
          </button>
          <button onClick={handleReset} className="btn-secondary">Reset</button>
        </div>
      </div>

      {/* Statistik */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isKeluar ? (
            <>
              <StatsCard title="Total Surat" value={statistik.total} icon={DocumentChartBarIcon} color="green" delay={0.05} />
              <StatsCard title="Selesai" value={statistik.selesai} icon={DocumentTextIcon} color="blue" delay={0.1} />
              <StatsCard title="Menunggu TTD" value={statistik.menunggu} icon={DocumentTextIcon} color="yellow" delay={0.15} />
              <StatsCard title="Ditolak" value={statistik.ditolak} icon={DocumentTextIcon} color="red" delay={0.2} />
            </>
          ) : (
            <>
              <StatsCard title="Total Surat" value={statistik.total} icon={DocumentChartBarIcon} color="green" delay={0.05} />
              <StatsCard title="Baru" value={statistik.baru} icon={DocumentTextIcon} color="blue" delay={0.1} />
              <StatsCard title="Dibaca" value={statistik.dibaca} icon={DocumentTextIcon} color="yellow" delay={0.15} />
              <StatsCard title="Didisposisi" value={statistik.didisposisi} icon={DocumentTextIcon} color="purple" delay={0.2} />
            </>
          )}
        </div>
      )}

      {/* Tabel */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <DocumentChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada data untuk filter yang dipilih</p>
          </div>
        ) : isKeluar ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8">No</th>
                  <th>Nomor Surat</th>
                  <th>Perihal</th>
                  <th>Tujuan</th>
                  <th>Tanggal</th>
                  <th>Pembuat</th>
                  <th>Penandatangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="text-gray-400 text-xs">{i + 1}</td>
                    <td className="font-mono text-xs text-gray-500">{s.nomorSurat || <span className="text-gray-300">—</span>}</td>
                    <td>
                      <p className="font-medium text-gray-800 text-sm">{s.perihal}</p>
                      <p className="text-xs text-gray-400">{s.jenisSurat}</p>
                    </td>
                    <td className="text-xs text-gray-600 max-w-[160px]">
                      {(s.tujuanSurat || s.penerimaEksternal || '—').split('\n').map((line, li) => (
                        <span key={li}>{line}{li < (s.tujuanSurat || '').split('\n').length - 1 && <br />}</span>
                      ))}
                    </td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.tanggalMasehi)}</td>
                    <td className="text-xs text-gray-600">{s.pembuat?.namaLengkap || '—'}</td>
                    <td className="text-xs text-gray-600">
                      <div>{s.sekretaris?.namaLengkap || '—'}</div>
                      <div>{s.ketua?.namaLengkap || '—'}</div>
                    </td>
                    <td><span className={getStatusClass(s.status)}>{getStatusLabel(s.status)}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8">No</th>
                  <th>Nomor Surat</th>
                  <th>Pengirim</th>
                  <th>Perihal</th>
                  <th>Tgl Surat</th>
                  <th>Tgl Terima</th>
                  <th>Diinput Oleh</th>
                  <th>Disposisi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="text-gray-400 text-xs">{i + 1}</td>
                    <td className="font-mono text-xs text-gray-500">{s.nomorSurat || <span className="text-gray-300">—</span>}</td>
                    <td className="text-sm font-medium text-gray-800">{s.pengirim}</td>
                    <td className="text-sm text-gray-700">{s.perihal}</td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.tanggalSurat)}</td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.tanggalTerima)}</td>
                    <td className="text-xs text-gray-600">{s.uploader?.namaLengkap || '—'}</td>
                    <td className="text-xs text-gray-600">
                      {s.disposisi?.length > 0
                        ? s.disposisi.map(d => d.penerima?.namaLengkap).filter(Boolean).join(', ')
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td><span className={getStatusClass(s.status)}>{getStatusLabel(s.status)}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {list.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Menampilkan {list.length} data
        </p>
      )}
    </div>
  )
}
