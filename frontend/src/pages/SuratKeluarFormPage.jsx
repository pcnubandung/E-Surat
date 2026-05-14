import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, DocumentCheckIcon, InformationCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { suratKeluarAPI, userAPI } from '../services/api'
import RichTextEditor from '../components/editor/RichTextEditor'
import PDFPreviewModal from '../components/ui/PDFPreviewModal'
import { JENIS_SURAT_OPTIONS } from '../utils/helpers'

// ── Konversi Hijriyah (client-side) ─────────────────────────────────────────
const BULAN_HIJRIYAH = [
  "Muharram","Shafar","Rabi'ul Awwal","Rabi'ul Akhir",
  "Jumadil Awwal","Jumadil Akhir","Rajab","Sya'ban",
  "Ramadhan","Syawal","Dzulqa'dah","Dzulhijjah",
]
function gregorianToJD(y, m, d) {
  if (m <= 2) { y -= 1; m += 12 }
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5
}
function jdToHijri(jd) {
  jd = Math.floor(jd) + 0.5
  const z = jd - 1948438.5
  const a = Math.floor(z / 10631)
  const b = z - 10631 * a
  const c = Math.floor((b - 0.5) / 354.367)
  const d2 = b - Math.floor(354.367 * c + 0.5)
  const j = Math.floor((d2 + 0.5) / 29.5)
  return { day: Math.floor(d2 - 29.5 * j + 0.5), month: Math.min(j + 1, 12), year: 30 * a + c + 1 }
}
function toHijriyahStr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const jd = gregorianToJD(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const h = jdToHijri(jd)
  return `${h.day} ${BULAN_HIJRIYAH[h.month - 1]} ${h.year} H`
}

// ── Default form ─────────────────────────────────────────────────────────────
const defaultForm = {
  jenisSurat: 'A',
  perihal: '',
  lampiran: '',
  isiSurat: '',
  lampiranIsi: '',
  tujuanSurat: '',
  tanggalMasehi: new Date().toISOString().split('T')[0],
  tanggalHijriyah: '',
  tempatTerbit: 'Bandung',
  sekretarisId: '',
  ketuaId: '',
  penerimaEksternal: '',
  penerimaInternalIds: [],
}

export default function SuratKeluarFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState(defaultForm)
  const [previewModal, setPreviewModal] = useState(false)

  // Load existing surat for edit
  const { data: existingSurat } = useQuery({
    queryKey: ['surat-keluar-detail', id],
    queryFn: () => suratKeluarAPI.getById(id).then(r => r.data.data),
    enabled: isEdit,
  })

  const { data: sekretarisList } = useQuery({
    queryKey: ['users-sekretaris'],
    queryFn: () => userAPI.getByRole('SEKRETARIS').then(r => r.data.data),
  })
  const { data: ketuaList } = useQuery({
    queryKey: ['users-ketua'],
    queryFn: () => userAPI.getByRole('KETUA').then(r => r.data.data),
  })
  const { data: allUsers } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => userAPI.getByRole('').then(r => r.data.data),
  })

  // Populate form saat edit
  useEffect(() => {
    if (existingSurat) {
      setForm({
        jenisSurat:          existingSurat.jenisSurat          || 'A',
        perihal:             existingSurat.perihal              || '',
        lampiran:            existingSurat.lampiran             || '',
        isiSurat:            existingSurat.isiSurat             || '',
        lampiranIsi:         existingSurat.lampiranIsi          || '',
        tujuanSurat:         existingSurat.tujuanSurat          || '',
        tanggalMasehi:       existingSurat.tanggalMasehi?.split('T')[0] || defaultForm.tanggalMasehi,
        tanggalHijriyah:     existingSurat.tanggalHijriyah      || '',
        tempatTerbit:        existingSurat.tempatTerbit         || 'Bandung',
        sekretarisId:        existingSurat.sekretarisId         || '',
        ketuaId:             existingSurat.ketuaId              || '',
        penerimaEksternal:   existingSurat.penerimaEksternal    || '',
        penerimaInternalIds: existingSurat.penerimaInternal?.map(p => p.userId) || [],
      })
    }
  }, [existingSurat])

  // Auto-hitung Hijriyah
  useEffect(() => {
    if (form.tanggalMasehi) {
      setForm(p => ({ ...p, tanggalHijriyah: toHijriyahStr(form.tanggalMasehi) }))
    }
  }, [form.tanggalMasehi])

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? suratKeluarAPI.update(id, data) : suratKeluarAPI.create(data),
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries(['surat-keluar'])
      navigate('/surat-keluar')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan surat'),
  })

  const handleSubmit = (isDraft) => {
    if (!form.perihal.trim())                        { toast.error('Perihal harus diisi'); return }
    if (!form.isiSurat || form.isiSurat === '<p></p>') { toast.error('Isi surat harus diisi'); return }
    if (!form.tanggalMasehi)                         { toast.error('Tanggal harus diisi'); return }
    if (!isDraft && !form.sekretarisId)              { toast.error('Pilih penandatangan sekretaris'); return }
    saveMutation.mutate({ ...form, isDraft })
  }

  const togglePenerima = (uid) => {
    setForm(p => ({
      ...p,
      penerimaInternalIds: p.penerimaInternalIds.includes(uid)
        ? p.penerimaInternalIds.filter(x => x !== uid)
        : [...p.penerimaInternalIds, uid],
    }))
  }

  const set = (key) => (val) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Surat Keluar' : 'Buat Surat Keluar'}</h1>
          <p className="text-sm text-gray-500">Isi formulir surat keluar di bawah ini</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Kolom Utama ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Informasi Surat */}
          <div className="card card-body space-y-4">
            <h2 className="section-title">Informasi Surat</h2>

            {/* Jenis Surat */}
            <div>
              <label className="label">Jenis Surat <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.jenisSurat}
                onChange={e => setForm(p => ({ ...p, jenisSurat: e.target.value }))}>
                {JENIS_SURAT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Kode jenis surat akan masuk ke nomor surat otomatis
              </p>
            </div>

            {/* Perihal */}
            <div>
              <label className="label">Perihal <span className="text-red-500">*</span></label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Perihal surat..."
                value={form.perihal}
                onChange={e => setForm(p => ({ ...p, perihal: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">
                Tekan Enter untuk baris baru jika perihal lebih dari satu baris.
              </p>
            </div>

            {/* Lampiran (keterangan, bukan isi) */}
            <div>
              <label className="label">Lampiran</label>
              <input type="text" className="input-field"
                placeholder="contoh: 1 (Satu Lembar), atau kosongkan jika tidak ada"
                value={form.lampiran} onChange={e => setForm(p => ({ ...p, lampiran: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">
                Keterangan lampiran yang muncul di header surat (bukan isi lampiran)
              </p>
            </div>

            {/* Tanggal */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Tempat Terbit</label>
                <input type="text" className="input-field" placeholder="Bandung"
                  value={form.tempatTerbit} onChange={e => setForm(p => ({ ...p, tempatTerbit: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tanggal (Masehi) <span className="text-red-500">*</span></label>
                <input type="date" className="input-field" value={form.tanggalMasehi}
                  onChange={e => setForm(p => ({ ...p, tanggalMasehi: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tanggal (Hijriyah)</label>
                <input type="text" className="input-field bg-gray-50" value={form.tanggalHijriyah} readOnly />
              </div>
            </div>
          </div>

          {/* Tujuan Surat */}
          <div className="card card-body space-y-3">
            <div className="flex items-start gap-2">
              <h2 className="section-title">Kepada Yth.</h2>
              <div className="group relative">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 mt-0.5 cursor-help" />
                <div className="hidden group-hover:block absolute left-0 top-6 bg-gray-800 text-white text-xs rounded-lg p-2 w-56 z-10">
                  Isi tujuan surat yang akan dicetak. Penerima Internal di sidebar hanya untuk distribusi digital.
                </div>
              </div>
            </div>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder={"Pengurus PC Fatayat NU Kota Bandung\ndi\nTempat"}
              value={form.tujuanSurat}
              onChange={e => setForm(p => ({ ...p, tujuanSurat: e.target.value }))}
            />
            <p className="text-xs text-gray-400">
              Tulis tujuan surat persis seperti yang ingin dicetak. Baris baru = Enter.
            </p>
          </div>

          {/* Isi Surat */}
          <div className="card card-body space-y-3">
            <h2 className="section-title">Isi Surat <span className="text-red-500">*</span></h2>
            <p className="text-xs text-gray-400">
              Font default: Arial Narrow 12. Support teks Arab (gunakan rata kanan), tabel, dan format lengkap.
            </p>
            <RichTextEditor value={form.isiSurat} onChange={set('isiSurat')}
              placeholder="Tulis isi surat di sini..." minHeight="300px" />
          </div>

          {/* Isi Lampiran */}
          <div className="card card-body space-y-3">
            <h2 className="section-title">Isi Lampiran</h2>
            <p className="text-xs text-gray-400">
              Opsional — isi lampiran akan dicetak di halaman terpisah (halaman 2) dengan kop surat.
            </p>
            <RichTextEditor value={form.lampiranIsi} onChange={set('lampiranIsi')}
              placeholder="Tulis isi lampiran di sini (opsional)..." minHeight="150px" />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          {/* Penandatangan */}
          <div className="card card-body space-y-4">
            <h2 className="section-title">Penandatangan</h2>
            <div>
              <label className="label">Sekretaris</label>
              <select className="input-field" value={form.sekretarisId}
                onChange={e => setForm(p => ({ ...p, sekretarisId: e.target.value }))}>
                <option value="">— Pilih Sekretaris —</option>
                {sekretarisList?.map(u => (
                  <option key={u.id} value={u.id}>{u.namaLengkap}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ketua</label>
              <select className="input-field" value={form.ketuaId}
                onChange={e => setForm(p => ({ ...p, ketuaId: e.target.value }))}>
                <option value="">— Pilih Ketua —</option>
                {ketuaList?.map(u => (
                  <option key={u.id} value={u.id}>{u.namaLengkap}</option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Alur tanda tangan:</p>
              <p>1. Sekretaris → 2. Ketua</p>
              <p className="mt-1">Jika hanya Sekretaris dipilih, surat langsung selesai setelah TTD Sekretaris.</p>
            </div>
          </div>

          {/* Penerima Distribusi */}
          <div className="card card-body space-y-4">
            <h2 className="section-title">Distribusi Surat</h2>
            <p className="text-xs text-gray-400">Penerima yang dapat melihat surat di aplikasi setelah selesai ditandatangani</p>
            <div>
              <label className="label">Penerima Eksternal</label>
              <input type="text" className="input-field"
                placeholder="Nama/instansi (opsional)"
                value={form.penerimaEksternal}
                onChange={e => setForm(p => ({ ...p, penerimaEksternal: e.target.value }))} />
            </div>
            <div>
              <label className="label">Penerima Internal</label>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">{form.penerimaInternalIds.length} dipilih</span>
                <button
                  type="button"
                  onClick={() => {
                    const nonAdminIds = (allUsers || []).filter(u => u.role !== 'ADMIN').map(u => u.id)
                    const allSelected = nonAdminIds.every(id => form.penerimaInternalIds.includes(id))
                    setForm(p => ({
                      ...p,
                      penerimaInternalIds: allSelected
                        ? p.penerimaInternalIds.filter(id => !nonAdminIds.includes(id))
                        : [...new Set([...p.penerimaInternalIds, ...nonAdminIds])]
                    }))
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  {(allUsers || []).filter(u => u.role !== 'ADMIN').every(u => form.penerimaInternalIds.includes(u.id))
                    ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                {allUsers?.map(u => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox"
                      checked={form.penerimaInternalIds.includes(u.id)}
                      onChange={() => togglePenerima(u.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{u.namaLengkap}</p>
                      <p className="text-xs text-gray-400">{u.jabatan || u.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Aksi */}
          <div className="card card-body space-y-3">
            {isEdit && (
              <button
                type="button"
                onClick={() => setPreviewModal(true)}
                className="btn-secondary w-full justify-center"
              >
                <EyeIcon className="w-4 h-4" />
                Preview PDF
              </button>
            )}
            <button onClick={() => handleSubmit(true)} disabled={saveMutation.isPending}
              className="btn-secondary w-full justify-center">
              {saveMutation.isPending ? 'Menyimpan...' : '💾 Simpan sebagai Draft'}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={saveMutation.isPending}
              className="btn-primary w-full justify-center">
              <DocumentCheckIcon className="w-4 h-4" />
              {saveMutation.isPending ? 'Mengirim...' : 'Kirim ke Sekretaris'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Preview PDF — hanya tersedia saat edit (surat sudah ada di DB) */}
      {isEdit && (
        <PDFPreviewModal
          isOpen={previewModal}
          onClose={() => setPreviewModal(false)}
          suratId={id}
          nomorSurat={existingSurat?.nomorSurat}
        />
      )}
    </div>
  )
}
