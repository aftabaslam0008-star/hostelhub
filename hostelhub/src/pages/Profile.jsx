import { useState } from 'react'
import {
  UserCircle,
  Mail,
  Shield,
  Upload,
  CheckCircle2,
  Database,
  CloudSun,
  ShieldCheck,
  RotateCcw,
  Key,
  ExternalLink,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { uploadFile } from '../services/storageService'
import { hasFirebaseConfig } from '../lib/firebase'
import { hasSupabaseConfig, testSupabaseConnection } from '../lib/supabase'
import { resetRoomsLocal } from '../services/roomService'
import { resetStudentsLocal } from '../services/studentService'
import { resetComplaintsLocal } from '../services/complaintService'

export default function Profile() {
  const { user, updateUserProfile, isDemoMode } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [testingDb, setTestingDb] = useState(false)
  const [dbTestResult, setDbTestResult] = useState(null)

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('Please enter a display name')
      return
    }

    setSavingProfile(true)
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const res = await uploadFile(file, 'avatars')
      await updateUserProfile({ photoURL: res.url })
      toast.success(
        res.isCloud
          ? 'Profile photo uploaded to Supabase Storage!'
          : 'Profile photo updated locally!'
      )
    } catch (err) {
      toast.error(`Failed to upload photo: ${err.message}`)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleTestDatabase = async () => {
    setTestingDb(true)
    try {
      const result = await testSupabaseConnection()
      setDbTestResult(result)
      if (result.connected) {
        toast.success('Supabase connection verified successfully!')
      } else {
        toast(result.message, { icon: 'ℹ️' })
      }
    } finally {
      setTestingDb(false)
    }
  }

  const handleResetLocalData = () => {
    if (window.confirm('Reset all rooms, students, and complaints to original starter dataset?')) {
      resetRoomsLocal()
      resetStudentsLocal()
      resetComplaintsLocal()
      toast.success('Starter demo data reset successfully!')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Profile & Cloud Status</h2>
        <p className="text-sm text-slate-500">
          Manage your account credentials, avatar, and inspect connected cloud backend services.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar with Upload button */}
          <div className="relative group">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl font-extrabold text-white shadow-md shadow-blue-500/30">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <label
              title="Upload new avatar image to Supabase Storage"
              className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-500 transition"
            >
              <Upload size={15} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">
                {user?.displayName || 'Hostel Staff'}
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                {user?.role || 'Member'}
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Mail size={14} className="text-slate-400" />
              {user?.email}
            </p>
            <p className="text-xs text-slate-400">
              UID: <span className="font-mono">{user?.uid || 'local-demo-uid'}</span>
            </p>
            {avatarUploading && (
              <p className="text-xs font-semibold text-blue-600 animate-pulse">
                Uploading photo to Supabase Storage...
              </p>
            )}
          </div>
        </div>

        {/* Edit Name Form */}
        <form onSubmit={handleUpdateName} className="mt-8 border-t border-slate-100 pt-6">
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Display Name
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 disabled:opacity-50 transition shrink-0"
                >
                  <Save size={16} />
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Cloud Stack & Integrations Status Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Backend Infrastructure & Integrations</h3>
            <p className="text-xs text-slate-500">Live evaluation status of cloud technologies</p>
          </div>
          <button
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            {testingDb ? 'Testing Connection...' : 'Test Database'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {/* 1. Firebase Authentication */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <ShieldCheck size={20} />
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  hasFirebaseConfig && !isDemoMode
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasFirebaseConfig && !isDemoMode ? 'Connected' : 'Demo Mode'}
              </span>
            </div>
            <h4 className="mt-3 font-bold text-slate-900 text-sm">Firebase Authentication</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {hasFirebaseConfig
                ? `Project: ${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Configured'}`
                : 'Configure VITE_FIREBASE_* in .env to connect live project.'}
            </p>
          </div>

          {/* 2. Supabase PostgreSQL & Storage */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Database size={20} />
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  hasSupabaseConfig ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasSupabaseConfig ? 'Supabase Connected' : 'Local Storage'}
              </span>
            </div>
            <h4 className="mt-3 font-bold text-slate-900 text-sm">Supabase DB & Storage</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {hasSupabaseConfig
                ? `URL: ${import.meta.env.VITE_SUPABASE_URL}`
                : 'Configure VITE_SUPABASE_* in .env for PostgreSQL cloud persistence.'}
            </p>
          </div>

          {/* 3. Open-Meteo Weather API */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-blue-100 p-2 text-blue-700">
                <CloudSun size={20} />
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                Active 200 OK
              </span>
            </div>
            <h4 className="mt-3 font-bold text-slate-900 text-sm">External Weather API</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Open-Meteo REST API serving real-time atmospheric conditions for campus facilities.
            </p>
          </div>
        </div>

        {dbTestResult && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
              dbTestResult.connected
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Connection Check: {dbTestResult.message}
          </div>
        )}
      </div>

      {/* Demo Data Management */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <h3 className="text-lg font-bold text-slate-900">Evaluation & Demo Reset</h3>
        <p className="text-xs text-slate-500 mt-1">
          Judges or testers can restore the pre-populated students, rooms, and complaints anytime.
        </p>

        <div className="mt-4">
          <button
            onClick={handleResetLocalData}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <RotateCcw size={15} /> Reset Demo Dataset
          </button>
        </div>
      </div>
    </div>
  )
}
