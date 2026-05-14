import { Bars3Icon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getRoleLabel, getRoleColor } from '../../utils/helpers'
import NotificationToggle from '../NotificationToggle'
import NotifikasiBell from '../NotifikasiBell'

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span className={`badge hidden sm:inline-flex ${getRoleColor(user?.role)}`}>
          {getRoleLabel(user?.role)}
        </span>

        {/* Notifikasi in-app */}
        <NotifikasiBell />

        {/* Toggle push notification */}
        <NotificationToggle />

        {/* User avatar */}
        <NavLink to="/edit-profil" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
            {user?.fotoProfil ? (
              <img src={user.fotoProfil} alt="Foto Profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-xs">
                {user?.namaLengkap?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
            {user?.namaLengkap}
          </span>
        </NavLink>
      </div>
    </header>
  )
}
