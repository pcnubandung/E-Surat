import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { useDynamicFavicon } from './utils/useDynamicFavicon'
import { PWAInstallPrompt, PWAUpdatePrompt } from './components/PWAInstallPrompt'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SuratKeluarPage from './pages/SuratKeluarPage'
import SuratKeluarFormPage from './pages/SuratKeluarFormPage'
import SuratKeluarDetailPage from './pages/SuratKeluarDetailPage'
import SuratMasukPage from './pages/SuratMasukPage'
import SuratMasukFormPage from './pages/SuratMasukFormPage'
import SuratMasukDetailPage from './pages/SuratMasukDetailPage'
import DisposisiPage from './pages/DisposisiPage'
import ManajemenUserPage from './pages/ManajemenUserPage'
import ProfilOrganisasiPage from './pages/ProfilOrganisasiPage'
import EditProfilPage from './pages/EditProfilPage'
import RekapPage from './pages/RekapPage'
import VerifikasiPublikPage from './pages/VerifikasiPublikPage'
import AgendaPage from './pages/AgendaPage'
import AgendaDetailPage from './pages/AgendaDetailPage'
import ScanQRPage from './pages/ScanQRPage'
import HadirVerifikasiPage from './pages/HadirVerifikasiPage'
import HadirPublikPage from './pages/HadirPublikPage'
import RiwayatPresensiPage from './pages/RiwayatPresensiPage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  const { isAuthenticated } = useAuthStore()
  useDynamicFavicon()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route path="/verifikasi/:token" element={<VerifikasiPublikPage />} />
        {/* Absen — satu route untuk semua, cek login di dalam halaman */}
        <Route path="/hadir/:token" element={<HadirVerifikasiPage />} />
        <Route path="/hadir-publik/:token" element={<HadirPublikPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Surat Keluar - hanya ADMIN, SEKRETARIS, KETUA */}
          <Route 
            path="surat-keluar" 
            element={
              <ProtectedRoute roles={['ADMIN', 'SEKRETARIS', 'KETUA']}>
                <SuratKeluarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="surat-keluar/buat" 
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <SuratKeluarFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="surat-keluar/edit/:id" 
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <SuratKeluarFormPage />
              </ProtectedRoute>
            } 
          />
          <Route path="surat-keluar/:id" element={<SuratKeluarDetailPage />} />
          
          {/* Surat Masuk */}
          <Route path="surat-masuk" element={<SuratMasukPage />} />
          <Route 
            path="surat-masuk/tambah" 
            element={
              <ProtectedRoute roles={['ADMIN', 'SEKRETARIS', 'KETUA']}>
                <SuratMasukFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="surat-masuk/edit/:id" 
            element={
              <ProtectedRoute roles={['ADMIN', 'SEKRETARIS', 'KETUA']}>
                <SuratMasukFormPage />
              </ProtectedRoute>
            } 
          />
          <Route path="surat-masuk/:id" element={<SuratMasukDetailPage />} />
          
          {/* Disposisi */}
          <Route path="disposisi" element={<DisposisiPage />} />
          
          {/* Admin only */}
          <Route 
            path="manajemen-user" 
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ManajemenUserPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="profil-organisasi" 
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ProfilOrganisasiPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="rekap"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <RekapPage />
              </ProtectedRoute>
            }
          />
          
          {/* Profil user */}
          <Route path="edit-profil" element={<EditProfilPage />} />

          {/* Agenda */}
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="agenda/:id" element={<AgendaDetailPage />} />
          <Route path="scan-qr" element={<ScanQRPage />} />
          <Route path="riwayat-presensi" element={<RiwayatPresensiPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </BrowserRouter>
  )
}

export default App
