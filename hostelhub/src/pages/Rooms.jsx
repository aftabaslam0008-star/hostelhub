import { useState, useEffect } from 'react'
import {
  BedDouble,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Wrench,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getRooms, addRoom, updateRoom, deleteRoom } from '../services/roomService'
import { getStudents } from '../services/studentService'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Loader from '../components/common/Loader'

const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Deluxe']
const STATUS_OPTIONS = ['Available', 'Full', 'Maintenance']

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterFloor, setFilterFloor] = useState('All')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '1',
    room_type: 'Single',
    capacity: '1',
    monthly_rent: '200',
    status: 'Available',
  })

  const loadData = async () => {
    try {
      const [roomsData, studentsData] = await Promise.all([getRooms(), getStudents()])
      setRooms(roomsData || [])
      setStudents(studentsData || [])
    } catch (err) {
      toast.error('Failed to load room data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAddModal = () => {
    setEditingRoom(null)
    setFormData({
      room_number: '',
      floor: '1',
      room_type: 'Single',
      capacity: '1',
      monthly_rent: '200',
      status: 'Available',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (room) => {
    setEditingRoom(room)
    setFormData({
      room_number: room.room_number || '',
      floor: String(room.floor || 1),
      room_type: room.room_type || 'Single',
      capacity: String(room.capacity || 1),
      monthly_rent: String(room.monthly_rent || 0),
      status: room.status || 'Available',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.room_number.trim()) {
      toast.error('Please enter a room number')
      return
    }

    setSubmitting(true)
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          room_number: formData.room_number.trim(),
          floor: Number(formData.floor),
          room_type: formData.room_type,
          capacity: Number(formData.capacity),
          monthly_rent: Number(formData.monthly_rent),
          status: formData.status,
        })
        toast.success(`Room ${formData.room_number} updated successfully!`)
      } else {
        // Check duplicate
        if (rooms.some((r) => r.room_number.toLowerCase() === formData.room_number.trim().toLowerCase())) {
          toast.error(`Room ${formData.room_number} already exists`)
          setSubmitting(false)
          return
        }
        await addRoom({
          room_number: formData.room_number.trim(),
          floor: Number(formData.floor),
          room_type: formData.room_type,
          capacity: Number(formData.capacity),
          occupied_beds: 0,
          monthly_rent: Number(formData.monthly_rent),
          status: formData.status,
        })
        toast.success(`Room ${formData.room_number} added successfully!`)
      }
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    const targetRoom = rooms.find((r) => r.id === confirmDeleteId)
    // Check if students reside here
    const assignedStudents = students.filter((s) => s.room_number === targetRoom?.room_number)
    if (assignedStudents.length > 0) {
      toast.error(`Cannot delete Room ${targetRoom?.room_number}: ${assignedStudents.length} student(s) currently assigned. Please reassign them first.`)
      setConfirmDeleteId(null)
      return
    }

    try {
      await deleteRoom(confirmDeleteId)
      toast.success('Room deleted successfully')
      setConfirmDeleteId(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete room')
    }
  }

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = String(room.room_number).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'All' || room.room_type === filterType
    const matchesStatus = filterStatus === 'All' || room.status === filterStatus
    const matchesFloor = filterFloor === 'All' || String(room.floor) === String(filterFloor)
    return matchesSearch && matchesType && matchesStatus && matchesFloor
  })

  // Summary statistics
  const totalRooms = rooms.length
  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0)
  const occupiedBeds = students.filter((s) => s.status === 'Active' && s.room_number).length
  const availableBeds = Math.max(0, totalCapacity - occupiedBeds)
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0

  if (loading) return <Loader label="Loading rooms & occupancy..." size="lg" />

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hostel Rooms</h2>
          <p className="text-sm text-slate-500">
            Manage room allocations, bed availability, and rental pricing.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-500 transition"
        >
          <Plus size={18} /> Add New Room
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rooms</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalRooms}</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BedDouble size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Capacity</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalCapacity} <span className="text-sm font-medium text-slate-500">beds</span></span>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Beds</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{availableBeds}</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy Rate</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{occupancyRate}%</span>
            <div className="w-20 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full ${
                  occupancyRate > 90 ? 'bg-red-500' : occupancyRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by room number (e.g. 101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-xs text-slate-600">
            <Filter size={14} />
            <span className="font-semibold">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Types</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-xs text-slate-600">
            <span className="font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-xs text-slate-600">
            <span className="font-semibold">Floor:</span>
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BedDouble className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No rooms found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search query or filters, or add a new room.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => {
            const roomResidents = students.filter(
              (s) => s.room_number === room.room_number && s.status === 'Active'
            )
            const currentOccupancy = roomResidents.length
            const isFull = currentOccupancy >= Number(room.capacity)
            const isMaintenance = room.status === 'Maintenance'

            return (
              <div
                key={room.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-slate-300"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-slate-900">
                          Room {room.room_number}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          Floor {room.floor}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {room.room_type} Room
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isMaintenance
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : isFull
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isMaintenance ? (
                        <>
                          <Wrench size={12} /> Maintenance
                        </>
                      ) : isFull ? (
                        <>
                          <AlertCircle size={12} /> Full
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> Available
                        </>
                      )}
                    </span>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Occupancy</span>
                      <span>
                        {currentOccupancy} / {room.capacity} Beds
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull
                            ? 'bg-rose-500'
                            : currentOccupancy > 0
                            ? 'bg-blue-600'
                            : 'bg-slate-300'
                        }`}
                        style={{
                          width: `${Math.min(100, (currentOccupancy / Number(room.capacity)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Residents List */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Assigned Students ({roomResidents.length})
                    </p>
                    {roomResidents.length === 0 ? (
                      <p className="mt-1 text-xs italic text-slate-400">No students assigned yet</p>
                    ) : (
                      <ul className="mt-1.5 space-y-1">
                        {roomResidents.map((student) => (
                          <li
                            key={student.id}
                            className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span className="truncate">{student.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Footer with Rent & Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center text-slate-900 font-bold text-sm">
                    <DollarSign size={16} className="text-slate-400" />
                    <span>{room.monthly_rent}</span>
                    <span className="text-xs font-normal text-slate-500">/month</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      title="Edit Room"
                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(room.id)}
                      title="Delete Room"
                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Hostel Room'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Floor
                  </label>
                  <select
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Room Type
                  </label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => {
                      const t = e.target.value
                      const cap = t === 'Single' ? '1' : t === 'Double' ? '2' : t === 'Triple' ? '3' : '2'
                      setFormData({ ...formData, room_type: t, capacity: cap })
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Monthly Rent ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Operational Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmText="Yes, Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
