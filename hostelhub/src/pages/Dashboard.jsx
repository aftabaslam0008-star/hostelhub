import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  BedDouble,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { getStudents } from '../services/studentService'
import { getRooms } from '../services/roomService'
import { getComplaints } from '../services/complaintService'
import { getWeather, PRESET_LOCATIONS } from '../services/weatherService'
import { resetRoomsLocal } from '../services/roomService'
import { resetStudentsLocal } from '../services/studentService'
import { resetComplaintsLocal } from '../services/complaintService'
import Loader from '../components/common/Loader'
import { useAuth } from '../context/AuthContext'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981'] // Pending, In Progress, Resolved

export default function Dashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  // Weather state (External API)
  const [selectedLocation, setSelectedLocation] = useState(PRESET_LOCATIONS[0])
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  const fetchHostelData = async () => {
    try {
      const [studentsRes, roomsRes, compRes] = await Promise.all([
        getStudents(),
        getRooms(),
        getComplaints(),
      ])
      setStudents(studentsRes || [])
      setRooms(roomsRes || [])
      setComplaints(compRes || [])
    } catch (err) {
      toast.error('Failed to load hostel data')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherData = async (loc) => {
    setWeatherLoading(true)
    try {
      const result = await getWeather(loc.lat, loc.lon, loc.name)
      setWeatherData(result)
    } catch {
      toast.error('Unable to fetch live weather forecast')
    } finally {
      setWeatherLoading(false)
    }
  }

  useEffect(() => {
    fetchHostelData()
    fetchWeatherData(selectedLocation)
  }, [])

  const handleLocationChange = (e) => {
    const loc = PRESET_LOCATIONS.find((l) => l.name === e.target.value) || PRESET_LOCATIONS[0]
    setSelectedLocation(loc)
    fetchWeatherData(loc)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    toast('Detecting GPS location...', { icon: '📍' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const customLoc = {
          name: 'My Current Location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }
        setSelectedLocation(customLoc)
        fetchWeatherData(customLoc)
        toast.success('Loaded weather for current coordinates!')
      },
      (err) => {
        toast.error(`Location access denied: ${err.message}`)
      }
    )
  }

  const handleResetData = () => {
    if (window.confirm('Reset local demo dataset to default hostel records?')) {
      resetRoomsLocal()
      resetStudentsLocal()
      resetComplaintsLocal()
      fetchHostelData()
      toast.success('Demo data restored to initial state!')
    }
  }

  // Calculate statistics
  const totalStudents = students.length
  const activeStudents = students.filter((s) => s.status === 'Active').length
  const totalRooms = rooms.length
  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0)
  const occupiedBeds = students.filter((s) => s.status === 'Active' && s.room_number).length
  const availableBeds = Math.max(0, totalCapacity - occupiedBeds)
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0

  const pendingComplaints = complaints.filter((c) => c.status === 'Pending').length
  const inProgressComplaints = complaints.filter((c) => c.status === 'In Progress').length
  const resolvedComplaints = complaints.filter((c) => c.status === 'Resolved').length
  const urgentComplaints = complaints.filter(
    (c) => c.priority === 'Urgent' && c.status !== 'Resolved'
  ).length

  // Chart 1: Occupancy by Room Type
  const roomTypeMap = {}
  rooms.forEach((r) => {
    const type = r.room_type || 'Standard'
    if (!roomTypeMap[type]) {
      roomTypeMap[type] = { type, capacity: 0, occupied: 0 }
    }
    roomTypeMap[type].capacity += Number(r.capacity) || 0
    const residentCount = students.filter(
      (s) => s.room_number === r.room_number && s.status === 'Active'
    ).length
    roomTypeMap[type].occupied += residentCount
  })
  const roomTypeChartData = Object.values(roomTypeMap)

  // Chart 2: Complaints distribution
  const complaintsChartData = [
    { name: 'Pending', value: pendingComplaints },
    { name: 'In Progress', value: inProgressComplaints },
    { name: 'Resolved', value: resolvedComplaints },
  ].filter((d) => d.value > 0)

  // Weather icon helper
  const renderWeatherIcon = (iconName) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="h-8 w-8 text-amber-500 animate-spin-slow" />
      case 'cloud-sun':
        return <CloudSun className="h-8 w-8 text-amber-500" />
      case 'cloud':
        return <Cloud className="h-8 w-8 text-slate-500" />
      case 'cloud-rain':
      case 'cloud-drizzle':
        return <CloudRain className="h-8 w-8 text-blue-500" />
      case 'cloud-lightning':
        return <CloudLightning className="h-8 w-8 text-purple-500" />
      case 'snowflake':
        return <Snowflake className="h-8 w-8 text-cyan-400" />
      default:
        return <CloudSun className="h-8 w-8 text-amber-500" />
    }
  }

  if (loading) return <Loader label="Loading hostel dashboard..." size="lg" />

  return (
    <div className="space-y-6">
      {/* Header Greeting & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.displayName || 'Hostel Warden'}!
            </h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {user?.role || 'Staff'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Hostel operations, room occupancies, and maintenance live summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/students"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus size={15} /> Student
          </Link>
          <Link
            to="/rooms"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Plus size={15} /> Room
          </Link>
          <Link
            to="/complaints"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition"
          >
            <Plus size={15} /> Issue Ticket
          </Link>
          <button
            onClick={handleResetData}
            title="Reload initial demo dataset"
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Residents
            </p>
            <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Users size={20} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalStudents}</span>
            <span className="text-xs font-medium text-emerald-600">
              ({activeStudents} active)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">All registered student occupants</p>
        </div>

        {/* Total Rooms & Available Beds */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Room Capacity
            </p>
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <BedDouble size={20} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalRooms}</span>
            <span className="text-xs font-medium text-slate-500">
              ({totalCapacity} total beds)
            </span>
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-semibold">
            {availableBeds} beds currently available
          </p>
        </div>

        {/* Occupancy Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Occupancy Rate
            </p>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{occupancyRate}%</span>
            <span className="text-xs font-medium text-slate-500">
              {occupiedBeds}/{totalCapacity} occupied
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                occupancyRate > 90 ? 'bg-red-500' : occupancyRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Complaints */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Issues
            </p>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <ClipboardList size={20} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {pendingComplaints + inProgressComplaints}
            </span>
            {urgentComplaints > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
                {urgentComplaints} URGENT
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {pendingComplaints} pending · {resolvedComplaints} resolved
          </p>
        </div>
      </div>

      {/* EXTERNAL API SHOWCASE: Live Weather & Hostel Environment Control */}
      <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <CloudSun size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Campus Environment & Live Weather
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live External API: Open-Meteo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Real-time external atmospheric metrics used for hostel HVAC & facility planning.
              </p>
            </div>
          </div>

          {/* Location Picker & Geolocation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200">
              <MapPin size={14} className="text-blue-400" />
              <select
                value={selectedLocation.name}
                onChange={handleLocationChange}
                className="bg-transparent text-white focus:outline-hidden cursor-pointer text-xs"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name} className="bg-slate-900 text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleUseMyLocation}
              title="Detect my current location"
              className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              GPS
            </button>

            <button
              onClick={() => fetchWeatherData(selectedLocation)}
              title="Refresh weather"
              disabled={weatherLoading}
              className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={weatherLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {weatherLoading ? (
          <div className="py-8 text-center text-sm text-slate-300">
            <Loader label="Calling Open-Meteo external API..." />
          </div>
        ) : weatherData ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {/* Current Temperature & Condition */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
              <div className="p-2 rounded-xl bg-white/10">
                {renderWeatherIcon(weatherData.current?.conditionType || 'sunny')}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {weatherData.current?.temp}°C
                  </span>
                  <span className="text-xs text-slate-300">
                    (Feels {weatherData.current?.apparentTemp}°C)
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-200">
                  {weatherData.current?.condition}
                </p>
              </div>
            </div>

            {/* Humidity */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
              <div className="p-2 rounded-xl bg-white/10 text-cyan-300">
                <Droplets size={26} />
              </div>
              <div>
                <p className="text-2xl font-bold">{weatherData.current?.humidity}%</p>
                <p className="text-xs text-slate-300">Relative Humidity</p>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
              <div className="p-2 rounded-xl bg-white/10 text-teal-300">
                <Wind size={26} />
              </div>
              <div>
                <p className="text-2xl font-bold">{weatherData.current?.windSpeed} km/h</p>
                <p className="text-xs text-slate-300">Wind Velocity</p>
              </div>
            </div>

            {/* Automated Facility Advisory */}
            <div className="flex flex-col justify-between rounded-2xl bg-blue-950/60 p-4 border border-blue-400/20">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <AlertTriangle size={13} /> {weatherData.advisory?.title}
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-snug">
                  {weatherData.advisory?.message}
                </p>
              </div>
              <span className="mt-2 text-[10px] text-slate-400">
                API Updated: {weatherData.fetchedAt}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Room Occupancy Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Room Occupancy by Type</h3>
              <p className="text-xs text-slate-500">Total capacity vs currently assigned residents</p>
            </div>
            <Link to="/rooms" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View Rooms →
            </Link>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomTypeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="capacity" name="Total Beds" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="occupied" name="Occupied" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Complaints Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Maintenance Tickets Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution by current resolution status</p>
            </div>
            <Link to="/complaints" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Manage Tickets →
            </Link>
          </div>
          <div className="mt-4 h-64 w-full flex items-center justify-center">
            {complaintsChartData.length === 0 ? (
              <p className="text-sm text-slate-400">No active complaints</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {complaintsChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Student Registrations</h3>
            <Link to="/students" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All ({students.length})
            </Link>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {students.slice(0, 4).map((student) => (
              <div key={student.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {student.room_number ? `Room ${student.room_number}` : 'Unallocated'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {student.admission_date || 'Enrolled'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Maintenance Requests</h3>
            <Link to="/complaints" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All ({complaints.length})
            </Link>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {complaints.slice(0, 4).map((comp) => (
              <div key={comp.id} className="flex items-center justify-between py-3">
                <div className="space-y-0.5 max-w-[70%]">
                  <p className="text-sm font-semibold text-slate-800 truncate">{comp.title}</p>
                  <p className="text-xs text-slate-500">
                    Room {comp.room_number || 'General'} · {comp.category}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      comp.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : comp.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {comp.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{comp.priority} Priority</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
