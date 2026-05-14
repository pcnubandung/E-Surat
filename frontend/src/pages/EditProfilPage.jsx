import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import {
  UserCircleIcon, LockClosedIcon, EyeIcon, EyeSlashIcon,
  CameraIcon, TrashIcon, ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { getRoleLabel, getRoleColor } from '../utils/helpers'

export default function EditProfilPage() {
  const { user, updateUser } = useAuthStore()
  const fileInputRef = useRef(null)

  const [profileForm, setProfileForm] = useState({
    namaLengkap: user?.namaLengkap || '',
    jabatan: user?.jabatan || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    passwordLama: '', passwordBaru: '', konfirmasi: ''
  })
  const [showPasswords, setShowPasswords] = useState({ lama: false, baru: false, konfirmasi: false })
  const [fotoPreview, setFotoPreview] = useState(null)

  // Mutation upload foto
  const uploadFotoMutation = useMutation({
    mutationFn: (formData) => authAPI.uploadFotoProfil(formData),
    onSuccess: (res) => {
      toast.success('Foto profil berhasil diperbarui')
      updateUser(res.data.data)
      setFotoPreview(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengupload foto'),
  })

  // Mutation hapus foto
  const deleteFotoMutation = useMutation({
    mutationFn: () => authAPI.deleteFotoProfil(),
    onSuccess: (res) => {
      toast.success('Foto profil berhasil dihapus')
      updateUser(res.data.data)
      setFotoPreview(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus foto'),
  })

  const profileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      toast.success('Profil berhasil diperbarui')
      updateUser(res.data.data)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui profil'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      toast.success('Password berhasil diubah')
      setPasswordForm({ passwordLama: '', passwordBaru: '', konfirmasi: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah password'),
  })

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Preview lokal
    const url = URL.createObjectURL(file)
    setFotoPreview(url)
    // Langsung upload
    const formData = new FormData()
    formData.append('foto', file)
    uploadFotoMutation.mutate(formData)
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    if (!profileForm.namaLengkap.trim()) { toast.error('Nama lengkap harus diisi'); return }
    profileMutation.mutate(profileForm)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwordForm.passwordLama || !passwordForm.passwordBaru) {
      toast.error('Semua field password harus diisi'); return
    }
    if (passwordForm.passwordBaru !== passwordForm.konfirmasi) {
      toast.error('Konfirmasi password tidak cocok'); return
    }
    if (passwordForm.passwordBaru.length < 6) {
      toast.error('Password baru minimal 6 karakter'); return
    }
    passwordMutation.mutate({
      passwordLama: passwordForm.passwordLama,
      passwordBaru: passwordForm.passwordBaru,
    })
  }

  const toggleShow = (field) => setShowPasswords(p => ({ ...p, [field]: !p[field] }))

  // Sumber foto: preview lokal → foto dari server → null
  const fotoSrc = fotoPreview || user?.fotoProfil || null
  const inisial = user?.namaLengkap?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="page-title">Edit Profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Perbarui informasi profil dan password Anda</p>
      </div>

      {/* Avatar & info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 flex items-center gap-5"
      >
        {/* Foto profil dengan tombol ganti */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-100 flex items-center justify-center shadow-sm">
            {fotoSrc ? (
              <img
                src={fotoSrc}
                alt="Foto Profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary-700 font-bold text-3xl">{inisial}</span>
            )}
            {/* Overlay loading */}
            {uploadFotoMutation.isPending && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Tombol kamera */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadFotoMutation.isPending}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            title="Ganti foto profil"
          >
            <CameraIcon className="w-3.5 h-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{user?.namaLengkap}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          <span className={`badge mt-1 ${getRoleColor(user?.role)}`}>{getRoleLabel(user?.role)}</span>

          {/* Tombol hapus foto */}
          {user?.fotoProfil && (
            <button
              type="button"
              onClick={() => deleteFotoMutation.mutate()}
              disabled={deleteFotoMutation.isPending}
              className="flex items-center gap-1 mt-2 text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              {deleteFotoMutation.isPending ? 'Menghapus...' : 'Hapus foto'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Edit profil */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card card-body"
      >
        <div className="flex items-center gap-2 mb-5">
          <UserCircleIcon className="w-5 h-5 text-primary-600" />
          <h2 className="section-title">Informasi Profil</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Lengkap <span className="text-red-500">*</span></label>
            <input type="text" className="input-field" placeholder="Nama lengkap Anda"
              value={profileForm.namaLengkap}
              onChange={e => setProfileForm(p => ({ ...p, namaLengkap: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Nama ini akan digunakan pada tanda tangan digital surat resmi</p>
          </div>
          <div>
            <label className="label">Jabatan</label>
            <input type="text" className="input-field" placeholder="Jabatan Anda dalam organisasi"
              value={profileForm.jabatan}
              onChange={e => setProfileForm(p => ({ ...p, jabatan: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Jabatan ini akan muncul di bawah nama pada tanda tangan surat</p>
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </motion.div>

      {/* Ganti password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card card-body"
      >
        <div className="flex items-center gap-2 mb-5">
          <LockClosedIcon className="w-5 h-5 text-primary-600" />
          <h2 className="section-title">Ganti Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { key: 'passwordLama', label: 'Password Lama', showKey: 'lama' },
            { key: 'passwordBaru', label: 'Password Baru', showKey: 'baru' },
            { key: 'konfirmasi', label: 'Konfirmasi Password Baru', showKey: 'konfirmasi' },
          ].map(({ key, label, showKey }) => (
            <div key={key}>
              <label className="label">{label} <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPasswords[showKey] ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={passwordForm[key]}
                  onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                />
                <button type="button" onClick={() => toggleShow(showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPasswords[showKey] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
            {passwordMutation.isPending ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
