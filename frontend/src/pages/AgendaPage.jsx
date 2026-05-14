import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { agendaAPI, userAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import {
  PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon,
  MapPinIcon, ClockIcon, ArrowDownTrayIcon, UsersIcon,
  CheckCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const KATEGORI_OPTIONS = [
  { value: 'MUSYAWARAH', label: 'Musyawarah' },
  { value: 'RAPAT', label: 'Rapat' },
  { value: 'PENGAJIAN', label: 'Pengajian' },
  { value: 'LAIN_LAIN', label: 'Lain-lain' },
]
const TIPE_OPTIONS = [
  { value: 'LURING', label: 'Luring' },
  { value: 'DARING', label: 'Daring' },
  { value: 'HIBRID', label: 'Hibrid' },
]
const ZONA_OPTIONS = [
  { value: 'WIB', label: 'WIB', full: 'Waktu Indonesia Barat' },
  { value: 'WITA', label: 'WITA', full: 'Waktu Indonesia Tengah' },
  { value: 'WIT', label: 'WIT', full: 'Waktu Indonesia Timur' },
]
const KATEGORI_STYLE = {
  MUSYAWARAH: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  RAPAT:      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
  PENGAJIAN:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500' },
  LAIN_LAIN:  { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400' },
}
const TIPE_STYLE = {
  LURING: 'bg-orange-50 text-orange-600',
  DARING: 'bg-sky-50 text-sky-600',
  HIBRID: 'bg-violet-50 text-violet-600',
}

const emptyForm = {
  namaAgenda: '', penyelenggara: '', kategori: 'RAPAT', tipe: 'LURING',
  tempat: '', tanggal: '', waktuMulai: '', waktuSelesai: '', zonaWaktu: 'WIB',
  deskripsi: '', pesertaIds: [],
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function AgendaPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [pesertaSearch, setPesertaSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['agenda', search],
    queryFn: () => agendaAPI.getAll({ search }).then(r => r.data),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => userAPI.getAll().then(r => r.data.data),
    enabled: isAdmin && showForm,
  })

  const createMutation = useMutation({
    mutationFn: (d) => agendaAPI.create(d),
    onSuccess: () => { toast.success('Agenda berhasil dibuat'); qc.invalidateQueries(['agenda']); closeForm() },
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal membuat agenda'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agendaAPI.update(id, data),
    onSuccess: () => { toast.success('Agenda diperbarui'); qc.invalidateQueries(['agenda']); closeForm() },
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal memperbarui'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => agendaAPI.delete(id),
    onSuccess: () => { toast.success('Agenda dihapus'); qc.invalidateQueries(['agenda']) },
    onError: () => toast.error('Gagal menghapus agenda'),
  })

  const openCreate = () => { setForm(emptyForm); setEditData(null); setShowForm(true) }
  const openEdit = (item) => {
    setEditData(item)
    setForm({
      namaAgenda: item.namaAgenda, penyelenggara: item.penyelenggara,
      kategori: item.kategori, tipe: item.tipe, tempat: item.tempat,
      tanggal: format(new Date(item.tanggal), 'yyyy-MM-dd'),
      waktuMulai: item.waktuMulai, waktuSelesai: item.waktuSelesai,
      zonaWaktu: item.zonaWaktu, deskripsi: item.deskripsi || '',
      pesertaIds: item.peserta.map(p => p.userId),
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditData(null); setForm(emptyForm); setPesertaSearch('') }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (editData) updateMutation.mutate({ id: editData.id, data: form })
    else createMutation.mutate(form)
  }
  const togglePeserta = (uid) => setForm(f => ({
    ...f,
    pesertaIds: f.pesertaIds.includes(uid) ? f.pesertaIds.filter(i => i !== uid) : [...f.pesertaIds, uid]
  }))
  const handleDelete = (item) => {
    if (confirm(`Hapus agenda "${item.namaAgenda}"?`)) deleteMutation.mutate(item.id)
  }

  const downloadRekap = async () => {
    try {
      const res = await agendaAPI.rekapAgendaExcel()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'Rekap-Agenda.xlsx'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Rekap diunduh')
    } catch { toast.error('Gagal mengunduh rekap') }
  }

  const agenda = data?.data || []
  const filteredUsers = usersData?.filter(u =>
    u.namaLengkap.toLowerCase().includes(pesertaSearch.toLowerCase()) ||
    (u.jabatan || '').toLowerCase().includes(pesertaSearch.toLowerCase())
  ) || []

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.pagination?.total || 0} kegiatan terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={downloadRekap} className="btn-secondary flex items-center gap-2 text-sm">
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Rekap Excel</span>
            </button>
          )}
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Buat Agenda
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Cari nama agenda atau penyelenggara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9 w-full"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : agenda.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDaysIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Belum ada agenda</p>
          <p className="text-sm text-gray-400 mt-1">
            {isAdmin ? 'Klik "Buat Agenda" untuk menambahkan kegiatan baru' : 'Anda belum diundang ke agenda apapun'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agenda.map(item => {
            const ks = KATEGORI_STYLE[item.kategori] || KATEGORI_STYLE.LAIN_LAIN
            const ts = TIPE_STYLE[item.tipe] || TIPE_STYLE.LURING
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/agenda/${item.id}`)}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${ks.dot}`} />
                <div className="p-5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ks.bg} ${ks.text} ${ks.border}`}>
                      {KATEGORI_OPTIONS.find(k => k.value === item.kategori)?.label}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ts}`}>
                      {TIPE_OPTIONS.find(t => t.value === item.tipe)?.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
                    {item.namaAgenda}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{item.penyelenggara}</p>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{format(new Date(item.tanggal), 'EEEE, dd MMMM yyyy', { locale: localeId })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ClockIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{item.waktuMulai} – {item.waktuSelesai} {item.zonaWaktu}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPinIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{item.tempat}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        {item.peserta?.length || 0} peserta
                      </span>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        {item._count?.kehadiran || 0} hadir
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editData ? 'Edit Agenda' : 'Buat Agenda Baru'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Lengkapi informasi kegiatan</p>
              </div>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Nama Agenda */}
                <FormField label="Nama Agenda" required>
                  <input
                    className="input"
                    placeholder="Contoh: Rapat Koordinasi Bulanan"
                    value={form.namaAgenda}
                    onChange={e => setForm(f => ({ ...f, namaAgenda: e.target.value }))}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Penyelenggara" required>
                    <input className="input" placeholder="Nama penyelenggara" value={form.penyelenggara} onChange={e => setForm(f => ({ ...f, penyelenggara: e.target.value }))} required />
                  </FormField>
                  <FormField label="Kategori">
                    <select className="input" value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                      {KATEGORI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Tipe Agenda">
                    <select className="input" value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value }))}>
                      {TIPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Tempat" required>
                    <input className="input" placeholder="Lokasi kegiatan" value={form.tempat} onChange={e => setForm(f => ({ ...f, tempat: e.target.value }))} required />
                  </FormField>
                </div>

                {/* Waktu */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Jadwal Kegiatan</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tanggal" required>
                      <input type="date" className="input" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} required />
                    </FormField>
                    <FormField label="Zona Waktu">
                      <select className="input" value={form.zonaWaktu} onChange={e => setForm(f => ({ ...f, zonaWaktu: e.target.value }))}>
                        {ZONA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value} – {o.full}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Waktu Mulai" required>
                      <input type="time" className="input" value={form.waktuMulai} onChange={e => setForm(f => ({ ...f, waktuMulai: e.target.value }))} required />
                    </FormField>
                    <FormField label="Waktu Selesai" required>
                      <input type="time" className="input" value={form.waktuSelesai} onChange={e => setForm(f => ({ ...f, waktuSelesai: e.target.value }))} required />
                    </FormField>
                  </div>
                </div>

                <FormField label="Deskripsi">
                  <textarea
                    className="input min-h-[80px] resize-none"
                    placeholder="Keterangan tambahan tentang agenda..."
                    value={form.deskripsi}
                    onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  />
                </FormField>

                {/* Peserta */}
                {usersData && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Peserta</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {form.pesertaIds.length} dipilih
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nonAdminIds = filteredUsers.filter(u => u.role !== 'ADMIN').map(u => u.id)
                            const allSelected = nonAdminIds.every(id => form.pesertaIds.includes(id))
                            setForm(f => ({
                              ...f,
                              pesertaIds: allSelected
                                ? f.pesertaIds.filter(id => !nonAdminIds.includes(id))
                                : [...new Set([...f.pesertaIds, ...nonAdminIds])]
                            }))
                          }}
                          className="text-xs text-green-700 hover:text-green-800 font-medium underline"
                        >
                          {filteredUsers.filter(u => u.role !== 'ADMIN').every(u => form.pesertaIds.includes(u.id))
                            ? 'Batal Pilih Semua' : 'Pilih Semua'}
                        </button>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <input
                          type="text"
                          placeholder="Cari peserta..."
                          value={pesertaSearch}
                          onChange={e => setPesertaSearch(e.target.value)}
                          className="w-full text-sm bg-transparent outline-none px-1 placeholder-gray-400"
                        />
                      </div>
                      <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
                        {filteredUsers.map(u => {
                          const checked = form.pesertaIds.includes(u.id)
                          return (
                            <label key={u.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                                {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input type="checkbox" className="sr-only" checked={checked} onChange={() => togglePeserta(u.id)} />
                              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary-700">
                                {u.fotoProfil ? <img src={u.fotoProfil} className="w-full h-full object-cover rounded-full" /> : u.namaLengkap?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{u.namaLengkap}</p>
                                <p className="text-xs text-gray-400 truncate">{u.jabatan || u.role}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">Batal</button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Menyimpan...'
                    : editData ? 'Simpan Perubahan' : 'Buat Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
