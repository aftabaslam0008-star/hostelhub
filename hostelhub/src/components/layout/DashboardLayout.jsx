import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const titles = {
  '/': 'Hostel Overview',
  '/students': 'Resident Students',
  '/rooms': 'Room Management',
  '/complaints': 'Maintenance & Complaints',
  '/profile': 'My Profile & Cloud Status',
}

export default function DashboardLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors duration-200 dark:bg-[#0b0f19]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={titles[location.pathname] || 'HostelHub'}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
