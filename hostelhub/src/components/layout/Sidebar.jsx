import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ClipboardList,
  UserCircle,
  X,
  LogOut,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import BrandLogo from '../common/BrandLogo'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLinkClick = () => {
    onClose?.()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container:
          - lg:sticky lg:top-0 lg:h-screen lg:self-start: Stays with the user during scroll ("sath run kare")
          - overflow-y-auto overscroll-contain: Allows smooth scrolling inside sidebar so nothing is cut off
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:self-start lg:translate-x-0 overflow-y-auto overscroll-contain scrollbar-thin ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col p-4">
          {/* Animated Brand Logo & Close button */}
          <div className="mb-6 flex items-center justify-between px-1 pt-1">
            <BrandLogo size="md" animated={true} showSubtitle={true} />
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Live Feature Highlights Pill with Theme Switcher */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 border border-blue-100/80 dark:from-blue-950/40 dark:to-slate-800/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="animate-spin-slow" /> Cloud Connected
              </div>
              <button
                onClick={toggleTheme}
                title="Toggle Dark/Light Mode"
                className="cursor-pointer rounded-lg p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-amber-300"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Firebase Auth, Supabase DB & Storage, and live Open-Meteo external weather API.
            </p>
          </div>
        </div>

        {/* User Card at bottom - Sticky at bottom of sidebar */}
        <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-white/95 backdrop-blur-xs p-4 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-blue-600 text-sm font-bold text-white">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                  {user?.displayName || 'Hostel Staff'}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
