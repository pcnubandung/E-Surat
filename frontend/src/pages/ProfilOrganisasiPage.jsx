import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BuildingOfficeIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { organisasiAPI, getUploadUrl } from '../services/api'
import { PageLoader } from '../components/ui/LoadingSpinner'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { buatSingkatan } from '../utils/helpers'

export default function ProfilOrganisasiPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    tingkatanOrg: '', namaOrg: '', daerahOrg: '',
    alamat: '', telepon: '', email: '', website: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [deleteLogoConfirm, setDeleteLogoConfirm] = useState(false)

  const { data: profil, isLoading } = useQuery({
    queryKey: ['organisasi'],
    queryFn: () => organisasiAPI.getProfil().then(r => r.data.data),
  })

  useEffect(() => {
    if (profil) {
      setForm({
        tingkatanOrg: profil.tingkatanOrg || '',
        namaOrg:      profil.namaOrg      || '',
        daerahOrg:    profil.daerahOrg    || '',
        alamat:       profil.alamat        || '',
        telepon:      profil.telepon       || '',
        email:        profil.email         || '',
        website:      profil.website       || '',
      })
    }
  }, [profil])

  const updateMutation = useMutation({
    mutationFn: (fd) => organisasiAPI.updateProfil(fd),
    onSuccess: () => {
      toast.success('Profil organisasi berhasil diperbarui')
      queryClient.invalidateQueries(['organisasi'])
      setLogoFile(null)
      setLogoPreview(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui profil'),
  })

  const deleteLogoMutation = useMutation({
    mutationFn: () => organisasiAPI.deleteLogo(),
    onSuccess: () => {
      toast.success('Logo berhasil dihapus')
      queryClient.invalidateQueries(['organisasi'])
      setDeleteLogoConfirm(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus logo'),
  })

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.namaOrg.trim()) { toast.error('Nama organisasi harus diisi'); return }
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (logoFile) fd.append('logo', logoFile)
    updateMutation.mutate(fd)
  }

  if (isLoading) return <PageLoader />

  const currentLogo = logoPreview || (profil?.logoPath ? getUploadUrl(profil.logoPath) : null)
  // Preview singkatan nomor surat
  const singkatan = form.tingkatanOrg && form.namaOrg
    ? buatSingkatan(form.tingkatanOrg, form.namaOrg)
    : 'PC-FNU'
  const previewNomor = `001/A/${singkatan}/V/${new Date().getFullYear()}`

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Profil Organisasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola informasi organisasi dan kop surat</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Logo */}
        <div className="card card-body">
          <h2 className="section-title mb-4">Logo Organisasi</h2>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
              {currentLogo
                ? <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
                : <BuildingOfficeIcon className="w-10 h-10 text-gray-300" />
              }
            </div>
            <div className="flex-1 space-y-2">
              <label className="btn-secondary cursor-pointer inline-flex">
                <PhotoIcon className="w-4 h-4" />
                {currentLogo ? 'Ganti Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400">Format: JPG, PNG, WebP. Maks 5MB</p>
              {profil?.logoPath && (
                <button type="button" onClick={() => setDeleteLogoConfirm(true)}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                  <TrashIcon className="w-3.5 h-3.5" /> Hapus Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Identitas Organisasi */}
        <div className="card card-body space-y-4">
          <h2 className="section-title">Identitas Organisasi</h2>
          <p className="text-xs text-gray-400 -mt-2">
            Data ini digunakan untuk kop surat dan nomor surat otomatis
          </p>

          <div>
            <label className="label">Tingkatan Organisasi <span className="text-red-500">*</span></label>
            <input type="text" className="input-field"
              placeholder="contoh: Pimpinan Cabang"
              value={form.tingkatanOrg}
              onChange={e => setForm(p => ({ ...p, tingkatanOrg: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Singkatan: <strong>{form.tingkatanOrg.split(' ').map(w=>w[0]?.toUpperCase()||'').join('')}</strong></p>
          </div>

          <div>
            <label className="label">Nama Organisasi <span className="text-red-500">*</span></label>
            <input type="text" className="input-field"
              placeholder="contoh: Fatayat Nahdlatul Ulama"
              value={form.namaOrg}
              onChange={e => setForm(p => ({ ...p, namaOrg: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Singkatan: <strong>{form.namaOrg.split(' ').map(w=>w[0]?.toUpperCase()||'').join('')}</strong></p>
          </div>

          <div>
            <label className="label">Daerah Organisasi</label>
            <input type="text" className="input-field"
              placeholder="contoh: Kota Bandung"
              value={form.daerahOrg}
              onChange={e => setForm(p => ({ ...p, daerahOrg: e.target.value }))} />
          </div>

          {/* Preview nomor surat */}
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Preview format nomor surat:</p>
            <p className="font-mono text-sm font-semibold text-primary-700">{previewNomor}</p>
            <p className="text-xs text-gray-400 mt-1">
              Urutan / Jenis / <strong>{singkatan}</strong> / Bulan-Romawi / Tahun
            </p>
          </div>
        </div>

        {/* Kontak */}
        <div className="card card-body space-y-4">
          <h2 className="section-title">Kontak & Alamat</h2>
          <div>
            <label className="label">Alamat</label>
            <textarea className="input-field min-h-[70px] resize-none"
              placeholder="Alamat lengkap organisasi"
              value={form.alamat}
              onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">No. Telepon</label>
              <input type="text" className="input-field" placeholder="+62..."
                value={form.telepon} onChange={e => setForm(p => ({ ...p, telepon: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="info@..."
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Website</label>
            <input type="text" className="input-field" placeholder="www...."
              value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
          </div>
        </div>

        {/* Preview Kop Surat */}
        <div className="card card-body">
          <h2 className="section-title mb-4">Preview Kop Surat</h2>
          {/* Skala ~72% dari A4 (595pt → ~430px) agar proporsional */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white overflow-x-auto">
            <div style={{ minWidth: 420 }}>
              {/* Area kop — logo kiri, teks kanan (sama persis dengan PDF) */}
              <div className="flex items-center gap-0" style={{ paddingBottom: 6 }}>
                {/* Logo */}
                {currentLogo && (
                  <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 65, height: 65, marginRight: 10 }}>
                    <img
                      src={currentLogo}
                      alt="Logo"
                      style={{ maxWidth: 65, maxHeight: 65, width: 'auto', height: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                )}
                {/* Teks kop */}
                <div className="flex-1 text-center" style={{ lineHeight: 1.25 }}>
                  {/* Tingkatan — 10pt bold hijau */}
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', margin: 0 }}>
                    {form.tingkatanOrg || 'PIMPINAN CABANG'}
                  </p>
                  {/* Nama Org — 16pt bold hijau */}
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#166534', textTransform: 'uppercase', margin: '1px 0' }}>
                    {form.namaOrg || 'FATAYAT NAHDLATUL ULAMA'}
                  </p>
                  {/* Daerah — 11pt bold hijau */}
                  {form.daerahOrg && (
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', margin: '1px 0' }}>
                      {form.daerahOrg}
                    </p>
                  )}
                  {/* Alamat — 8.5pt regular abu */}
                  {form.alamat && (
                    <p style={{ fontSize: 8.5, color: '#333333', margin: '1px 0' }}>
                      {form.alamat}
                    </p>
                  )}
                  {/* Kontak — 7.5pt regular abu, dipisah | */}
                  {[form.telepon, form.email, form.website].filter(Boolean).length > 0 && (
                    <p style={{ fontSize: 7.5, color: '#333333', margin: '1px 0' }}>
                      {[
                        form.telepon && `No. Telp.: ${form.telepon}`,
                        form.email   && `Email: ${form.email}`,
                        form.website && `Website: ${form.website}`,
                      ].filter(Boolean).join('  |  ')}
                    </p>
                  )}
                </div>
              </div>
              {/* Garis tebal hijau — satu garis saja */}
              <div style={{ height: 2.5, backgroundColor: '#166534', marginTop: 4 }} />
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3 italic">
              Kop surat akan tampil seperti ini pada setiap halaman dokumen resmi
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary px-8">
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={deleteLogoConfirm}
        onClose={() => setDeleteLogoConfirm(false)}
        onConfirm={() => deleteLogoMutation.mutate()}
        loading={deleteLogoMutation.isPending}
        title="Hapus Logo?"
        message="Logo organisasi akan dihapus dari sistem."
        confirmLabel="Hapus Logo"
      />
    </div>
  )
}
