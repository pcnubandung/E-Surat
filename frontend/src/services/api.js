import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

// Helper untuk URL file upload — prefix dengan backend URL
export const getUploadUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (import.meta.env.VITE_API_URL || '').replace('/api', '')
  return `${base}${path}`
}

// Request interceptor - tambah token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadFotoProfil: (formData) => api.post('/auth/foto-profil', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFotoProfil: () => api.delete('/auth/foto-profil'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// Users
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getByRole: (role) => api.get(`/users/by-role${role ? `?role=${role}` : ''}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  delete: (id) => api.delete(`/users/${id}`),
  exportExcel: () => api.get('/users/export/excel', { responseType: 'blob' }),
  downloadTemplate: () => api.get('/users/export/template', { responseType: 'blob' }),
  importExcel: (formData) => api.post('/users/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// Surat Keluar
export const suratKeluarAPI = {
  getAll: (params) => api.get('/surat-keluar', { params }),
  getById: (id) => api.get(`/surat-keluar/${id}`),
  getStatistik: () => api.get('/surat-keluar/statistik'),
  create: (data) => api.post('/surat-keluar', data),
  update: (id, data) => api.put(`/surat-keluar/${id}`, data),
  delete: (id) => api.delete(`/surat-keluar/${id}`),
  kirim: (id) => api.post(`/surat-keluar/${id}/kirim`),
  tandaTangan: (id) => api.post(`/surat-keluar/${id}/tanda-tangan`),
  tolak: (id, data) => api.post(`/surat-keluar/${id}/tolak`, data),
  downloadPDF: (id) => api.get(`/surat-keluar/${id}/download`, { responseType: 'blob' }),
  previewPDF: (id) => api.get(`/surat-keluar/${id}/preview`, { responseType: 'blob' }),
}

// Surat Masuk
export const suratMasukAPI = {
  getAll: (params) => api.get('/surat-masuk', { params }),
  getById: (id) => api.get(`/surat-masuk/${id}`),
  getStatistik: () => api.get('/surat-masuk/statistik'),
  create: (formData) => api.post('/surat-masuk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/surat-masuk/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/surat-masuk/${id}`),
  getFileUrl: (id) => {
    const token = (() => { try { return JSON.parse(localStorage.getItem('safira-auth') || '{}')?.state?.token } catch { return null } })()
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '')
    return `${base}/api/surat-masuk/${id}/file${token ? `?token=${token}` : ''}`
  },
}

// Disposisi
export const disposisiAPI = {
  create: (data) => api.post('/disposisi', data),
  getBySurat: (suratMasukId) => api.get(`/disposisi/surat/${suratMasukId}`),
  getMy: (params) => api.get('/disposisi/my', { params }),
  tandaiDibaca: (id) => api.put(`/disposisi/${id}/baca`),
  jawab: (id, data) => api.put(`/disposisi/${id}/jawab`, data),
  delete: (id) => api.delete(`/disposisi/${id}`),
}

// Organisasi
export const organisasiAPI = {
  getProfil: () => api.get('/organisasi'),
  updateProfil: (formData) => api.put('/organisasi', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteLogo: () => api.delete('/organisasi/logo'),
}

// Rekap (Admin only)
export const rekapAPI = {
  getData:     (params) => api.get('/rekap', { params }),
  exportExcel: (params) => api.get('/rekap/excel', { params, responseType: 'blob' }),
  exportPDF:   (params) => api.get('/rekap/pdf',   { params, responseType: 'blob' }),
}

// Verifikasi (publik)
export const verifikasiAPI = {
  verify: (token) => api.get(`/verifikasi/${token}`),
}

// Notifikasi
export const notifikasiAPI = {
  getAll: () => api.get('/notifikasi'),
  tandaiDibaca: (id) => api.patch(`/notifikasi/${id}/baca`),
  tandaiSemuaDibaca: () => api.patch('/notifikasi/baca-semua'),
  hapusDibaca: () => api.delete('/notifikasi/hapus-dibaca'),
}

// Agenda
export const agendaAPI = {
  getAll: (params) => api.get('/agenda', { params }),
  getUpcoming: () => api.get('/agenda/upcoming'),
  getById: (id) => api.get(`/agenda/${id}`),
  getQRCode: (id) => api.get(`/agenda/${id}/qrcode`),
  create: (data) => api.post('/agenda', data),
  update: (id, data) => api.put(`/agenda/${id}`, data),
  delete: (id) => api.delete(`/agenda/${id}`),
  absenAplikasi: (token) => api.post(`/agenda/${token}/absen`),
  getRiwayat: (params) => api.get('/agenda/riwayat', { params }),
  rekapAgendaExcel: () => api.get('/agenda/rekap/agenda-excel', { responseType: 'blob' }),
  rekapKehadiranExcel: (id) => api.get(`/agenda/${id}/rekap/kehadiran-excel`, { responseType: 'blob' }),
  // Publik
  getByToken: (token) => api.get(`/agenda/publik/${token}`),
  absenForm: (token, data) => api.post(`/agenda/publik/${token}/absen`, data),
}

export default api
