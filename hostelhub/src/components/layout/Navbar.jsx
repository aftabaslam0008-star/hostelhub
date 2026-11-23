import { Menu, LogOut, ShieldCheck, Database, CloudSun, Sun, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { hasFirebaseConfig } from '../../lib/firebase'
import { hasSupabaseConfig } from '../../lib/supabase'

export default function Navbar({ title = 'Dashboard', onMenuClick }) {
  const { user, logout, isDemoMode } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            Smart Hostel Management Portal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend Connectivity Status Pills */}
        <div className="hidden items-center gap-2 md:flex">
          <span
            title={hasFirebaseConfig ? 'Firebase Auth Connected' : 'Demo Local Auth Mode'}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              hasFirebaseConfig && !isDemoMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <ShieldCheck size={13} />
            <span>{hasFirebaseConfig && !isDemoMode ? 'Firebase Live' : 'Auth: Demo'}</span>
          </span>

          <span
            title={hasSupabaseConfig ? 'Supabase Postgres Connected' : 'Local Storage Mode'}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              hasSupabaseConfig
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <Database size={13} />
            <span>{hasSupabaseConfig ? 'Supabase DB' : 'DB: Local'}</span>
          </span>

          <span
            title="Open-Meteo Public Weather API Active"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
          >
            <CloudSun size={13} />
            <span>Weather API</span>
          </span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="transition-transform duration-300 rotate-0 hover:rotate-90" />
          ) : (
            <Moon size={18} className="transition-transform duration-300 rotate-0 hover:-rotate-12 text-slate-700" />
          )}
        </button>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.displayName || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'Member'}</p>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Sign Out"
            className="cursor-pointer rounded-xl p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
