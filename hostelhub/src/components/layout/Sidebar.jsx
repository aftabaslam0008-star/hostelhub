import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ClipboardList,
  UserCircle,
  Building2,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { user, logout } = useAuth()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col p-4">
          {/* Logo & Close button */}
          <div className="mb-6 flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Building2 size={22} />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">HostelHub</span>
                <span className="block text-[10px] font-semibold tracking-wider text-blue-600 uppercase">
                  Management Portal
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden cursor-pointer"
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
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Live Feature Highlights Pill */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 border border-blue-100/80">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
              <Sparkles size={14} /> Full Cloud Stack
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Firebase Auth, Supabase DB & Storage, and live Open-Meteo external API ready.
            </p>
          </div>
        </div>

        {/* User Card at bottom */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <p className="truncate text-sm font-bold text-slate-800">
                  {user?.displayName || 'Hostel Staff'}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
