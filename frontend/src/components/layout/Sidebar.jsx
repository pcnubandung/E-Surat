import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon, DocumentTextIcon, InboxIcon,
  UsersIcon, BuildingOfficeIcon, ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon, XMarkIcon, ClipboardDocumentListIcon,
  ChartBarIcon, CalendarDaysIcon, QrCodeIcon, ClockIcon,
} from '@heroicons/react/24/outline'
import useAuthStore from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { organisasiAPI, getUploadUrl } from '../../services/api'

const navItems = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard', roles: ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'] },
  { to: '/surat-keluar', icon: DocumentTextIcon, label: 'Surat Keluar', roles: ['ADMIN', 'SEKRETARIS', 'KETUA'] },
  { to: '/surat-masuk', icon: InboxIcon, label: 'Surat Masuk', roles: ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'] },
  { to: '/disposisi', icon: ClipboardDocumentListIcon, label: 'Disposisi', roles: ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'] },
  { to: '/agenda', icon: CalendarDaysIcon, label: 'Agenda Kegiatan', roles: ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'] },
  { to: '/riwayat-presensi', icon: ClockIcon, label: 'Riwayat Presensi', roles: ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'] },
  { to: '/scan-qr', icon: QrCodeIcon, label: 'Scan QR', roles: ['ADMIN', 'SEKRETARIS', 'KETUA', 'PENGURUS'] },
  { to: '/rekap', icon: ChartBarIcon, label: 'Rekap Surat', roles: ['ADMIN'] },
  { to: '/manajemen-user', icon: UsersIcon, label: 'Manajemen User', roles: ['ADMIN'] },
  { to: '/profil-organisasi', icon: BuildingOfficeIcon, label: 'Profil Organisasi', roles: ['ADMIN'] },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: orgData } = useQuery({
    queryKey: ['organisasi'],
    queryFn: () => organisasiAPI.getProfil().then(r => r.data.data),
    staleTime: 60000,
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role))

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo & Org Name */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          {orgData?.logoPath ? (
            <img src={getUploadUrl(orgData.logoPath)} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-green">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-primary-900 text-sm leading-tight truncate">
            SAFIRA
          </p>
          <p className="text-xs text-gray-400 truncate">PC Fatayat NU Kota Bandung</p>
        </div>
        {/* Close button mobile */}
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info & logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <NavLink
          to="/edit-profil"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors mb-1"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
            {user?.fotoProfil ? (
              <img src={user.fotoProfil} alt="Foto Profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-700 font-semibold text-xs">
                {user?.namaLengkap?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.namaLengkap}</p>
            <p className="text-xs text-gray-400 truncate">{user?.jabatan || user?.role}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-30 w-64 lg:hidden"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
