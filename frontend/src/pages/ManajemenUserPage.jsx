import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusIcon, PencilIcon, TrashIcon, KeyIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { userAPI } from '../services/api'
import { getRoleLabel, getRoleColor } from '../utils/helpers'
import { PageLoader } from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const ROLES = ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS']
const defaultForm = { email: '', password: '', namaLengkap: '', jabatan: '', nomorHp: '', role: 'PENGURUS' }

export default function ManajemenUserPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'reset'
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [newPassword, setNewPassword] = useState('')
  const [importResult, setImportResult] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.getAll().then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => userAPI.create(data),
    onSuccess: () => { toast.success('User berhasil dibuat'); queryClient.invalidateQueries(['users']); closeModal() },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat user'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userAPI.update(id, data),
    onSuccess: () => { toast.success('User berhasil diperbarui'); queryClient.invalidateQueries(['users']); closeModal() },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui user'),
  })

  const resetMutation = useMutation({
    mutationFn: ({ id, passwordBaru }) => userAPI.resetPassword(id, { passwordBaru }),
    onSuccess: () => { toast.success('Password berhasil direset'); closeModal() },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal reset password'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => userAPI.delete(id),
    onSuccess: () => { toast.success('User berhasil dihapus'); queryClient.invalidateQueries(['users']); setDeleteId(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus user'),
  })

  const importMutation = useMutation({
    mutationFn: (formData) => userAPI.importExcel(formData),
    onSuccess: (res) => {
      const result = res.data.data
      queryClient.invalidateQueries(['users'])
      setImportResult(result)
      toast.success(res.data.message)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengimpor user'),
  })

  const openCreate = () => { setForm(defaultForm); setModal('create') }
  const openEdit = (user) => {
    setSelectedUser(user)
    setForm({ namaLengkap: user.namaLengkap, jabatan: user.jabatan || '', nomorHp: user.nomorHp || '', role: user.role, isActive: user.isActive })
    setModal('edit')
  }
  const openReset = (user) => { setSelectedUser(user); setNewPassword(''); setModal('reset') }
  const closeModal = () => { setModal(null); setSelectedUser(null); setForm(defaultForm); setNewPassword('') }

  const handleSubmit = () => {
    if (modal === 'create') {
      if (!form.email || !form.password || !form.namaLengkap) {
        toast.error('Email, password, dan nama lengkap harus diisi'); return
      }
      createMutation.mutate(form)
    } else if (modal === 'edit') {
      updateMutation.mutate({ id: selectedUser.id, data: form })
    } else if (modal === 'reset') {
      if (!newPassword || newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return }
      resetMutation.mutate({ id: selectedUser.id, passwordBaru: newPassword })
    }
  }

  const handleExport = async () => {
    try {
      const res = await userAPI.exportExcel()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'Data-User.xlsx'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Data user diunduh')
    } catch { toast.error('Gagal mengunduh data user') }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await userAPI.downloadTemplate()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'Template-Import-User.xlsx'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Template diunduh')
    } catch { toast.error('Gagal mengunduh template') }
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Hanya file Excel (.xlsx / .xls) yang didukung'); return
    }
    const fd = new FormData()
    fd.append('file', file)
    setImportResult(null)
    importMutation.mutate(fd)
    e.target.value = ''
  }

  const users = data || []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} user terdaftar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template */}
          <button onClick={handleDownloadTemplate} className="btn-secondary flex items-center gap-2 text-sm">
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Template</span>
          </button>
          {/* Import Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{importMutation.isPending ? 'Mengimpor...' : 'Import Excel'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          {/* Export Excel */}
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          {/* Tambah User */}
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Tambah User
          </button>
        </div>
      </div>

      {/* Hasil import */}
      {importResult && (
        <div className={`rounded-xl p-4 text-sm border ${importResult.gagal > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <p className="font-semibold mb-1">
            Hasil Import: <span className="text-green-700">{importResult.berhasil} berhasil</span>
            {importResult.gagal > 0 && <span className="text-red-600 ml-2">{importResult.gagal} gagal</span>}
          </p>
          {importResult.errors?.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-red-600 text-xs list-disc list-inside">
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Tutup</button>
        </div>
      )}

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length
          return (
            <div key={role} className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <span className={`badge mt-1 ${getRoleColor(role)}`}>{getRoleLabel(role)}</span>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Jabatan</th>
                  <th>No. Handphone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-semibold text-xs">{u.namaLengkap?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-800">{u.namaLengkap}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-xs">{u.email}</td>
                    <td className="text-gray-600 text-sm">{u.jabatan || '—'}</td>
                    <td className="text-gray-600 text-sm">{u.nomorHp || '—'}</td>
                    <td><span className={`badge ${getRoleColor(u.role)}`}>{getRoleLabel(u.role)}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => openReset(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-yellow-600 transition-colors" title="Reset Password">
                          <KeyIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Hapus">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={modal === 'create' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'create' ? 'Tambah User Baru' : 'Edit User'}
      >
        <div className="space-y-4">
          {modal === 'create' && (
            <div>
              <label className="label">Email <span className="text-red-500">*</span></label>
              <input type="email" className="input-field" placeholder="email@contoh.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="label">Nama Lengkap <span className="text-red-500">*</span></label>
            <input type="text" className="input-field" placeholder="Nama lengkap"
              value={form.namaLengkap} onChange={e => setForm(p => ({ ...p, namaLengkap: e.target.value }))} />
          </div>
          <div>
            <label className="label">Jabatan</label>
            <input type="text" className="input-field" placeholder="Jabatan dalam organisasi"
              value={form.jabatan} onChange={e => setForm(p => ({ ...p, jabatan: e.target.value }))} />
          </div>
          <div>
            <label className="label">No. Handphone</label>
            <input type="tel" className="input-field" placeholder="Contoh: 08123456789"
              value={form.nomorHp} onChange={e => setForm(p => ({ ...p, nomorHp: e.target.value }))} />
          </div>
          <div>
            <label className="label">Role <span className="text-red-500">*</span></label>
            <select className="input-field" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
            </select>
          </div>
          {modal === 'create' && (
            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <input type="password" className="input-field" placeholder="Minimal 6 karakter"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
          )}
          {modal === 'edit' && (
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.isActive ? 'true' : 'false'}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1">Batal</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal isOpen={modal === 'reset'} onClose={closeModal} title="Reset Password" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Reset password untuk <strong>{selectedUser?.namaLengkap}</strong></p>
          <div>
            <label className="label">Password Baru <span className="text-red-500">*</span></label>
            <input type="password" className="input-field" placeholder="Minimal 6 karakter"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={closeModal} className="btn-secondary flex-1">Batal</button>
            <button onClick={handleSubmit} disabled={resetMutation.isPending} className="btn-primary flex-1">
              {resetMutation.isPending ? 'Mereset...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Hapus User?"
        message="User yang dihapus tidak dapat dikembalikan. Semua data terkait user ini akan terpengaruh."
      />
    </div>
  )
}
