import { Menu, LogOut, ShieldCheck, Database, CloudSun, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { hasFirebaseConfig } from '../../lib/firebase'
import { hasSupabaseConfig } from '../../lib/supabase'

export default function Navbar({ title = 'Dashboard', onMenuClick }) {
  const { user, logout, isDemoMode } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="hidden text-xs text-slate-500 sm:block">Smart Hostel Management Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend Connectivity Status Pills */}
        <div className="hidden items-center gap-2 md:flex">
          <span
            title={hasFirebaseConfig ? 'Firebase Auth Connected' : 'Demo Local Auth Mode'}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              hasFirebaseConfig && !isDemoMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <ShieldCheck size={13} />
            <span>{hasFirebaseConfig && !isDemoMode ? 'Firebase Live' : 'Auth: Demo'}</span>
          </span>

          <span
            title={hasSupabaseConfig ? 'Supabase Postgres Connected' : 'Local Storage Mode'}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              hasSupabaseConfig
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Database size={13} />
            <span>{hasSupabaseConfig ? 'Supabase DB' : 'DB: Local'}</span>
          </span>

          <span
            title="Open-Meteo Public Weather API Active"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200"
          >
            <CloudSun size={13} />
            <span>Weather API</span>
          </span>
        </div>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/20"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.displayName || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Member'}</p>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Sign Out"
            className="cursor-pointer rounded-xl p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
