import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  BedDouble,
  Calendar,
  ShieldAlert,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getStudents, addStudent, updateStudent, deleteStudent } from '../services/studentService'
import { getRooms } from '../services/roomService'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Loader from '../components/common/Loader'
import { isValidEmail } from '../utils/validators'

export default function Students() {
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterRoom, setFilterRoom] = useState('All')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    room_number: '',
    admission_date: new Date().toISOString().split('T')[0],
    emergency_contact: '',
    status: 'Active',
  })

  const loadData = async () => {
    try {
      const [studentsData, roomsData] = await Promise.all([getStudents(), getRooms()])
      setStudents(studentsData || [])
      setRooms(roomsData || [])
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAddModal = () => {
    setEditingStudent(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      room_number: rooms[0]?.room_number || '',
      admission_date: new Date().toISOString().split('T')[0],
      emergency_contact: '',
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      room_number: student.room_number || '',
      admission_date: student.admission_date || new Date().toISOString().split('T')[0],
      emergency_contact: student.emergency_contact || '',
      status: student.status || 'Active',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Please enter student name')
      return
    }
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setSubmitting(true)
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          room_number: formData.room_number,
          admission_date: formData.admission_date,
          emergency_contact: formData.emergency_contact.trim(),
          status: formData.status,
        })
        toast.success(`Student ${formData.name} updated successfully!`)
      } else {
        await addStudent({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          room_number: formData.room_number,
          admission_date: formData.admission_date,
          emergency_contact: formData.emergency_contact.trim(),
          status: formData.status,
        })
        toast.success(`Student ${formData.name} enrolled successfully!`)
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
    try {
      await deleteStudent(confirmDeleteId)
      toast.success('Student record deleted successfully')
      setConfirmDeleteId(null)
      loadData()
    } catch {
      toast.error('Failed to delete student')
    }
  }

  // Filtered students
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      student.name?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.phone?.toLowerCase().includes(term) ||
      student.room_number?.toLowerCase().includes(term)
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus
    const matchesRoom = filterRoom === 'All' || student.room_number === filterRoom
    return matchesSearch && matchesStatus && matchesRoom
  })

  // Summary statistics
  const totalStudents = students.length
  const activeResidents = students.filter((s) => s.status === 'Active').length
  const unassigned = students.filter((s) => !s.room_number || s.room_number === '').length

  if (loading) return <Loader label="Loading student directory..." size="lg" />

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Resident Students</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Maintain hostel student directory, room allotments, and emergency contact details.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-500 transition"
        >
          <Plus size={18} /> Register Student
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Enrolled</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalStudents}</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Residents</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeResidents}</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unassigned</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{unassigned}</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <BedDouble size={20} />
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email, phone, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <Filter size={14} />
            <span className="font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer dark:text-white"
            >
              <option value="All" className="dark:bg-slate-900">All Statuses</option>
              <option value="Active" className="dark:bg-slate-900">Active</option>
              <option value="Inactive" className="dark:bg-slate-900">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Room:</span>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer dark:text-white"
            >
              <option value="All" className="dark:bg-slate-900">All Rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.room_number} className="dark:bg-slate-900">
                  Room {r.room_number}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No students found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              No residents match your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Assigned Room</th>
                  <th className="px-6 py-4">Admission</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{student.phone || 'N/A'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Emerg: {student.emergency_contact || 'None'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {student.room_number ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900">
                          <BedDouble size={14} /> Room {student.room_number}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Unallocated</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {student.admission_date || 'N/A'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          student.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {student.status === 'Active' ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {student.status || 'Active'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingStudent(student)}
                          title="View Details"
                          className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          title="Edit Student"
                          className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(student.id)}
                          title="Delete Student"
                          className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Register New Resident'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Ali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Room Allotment
                  </label>
                  <select
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">-- No Room Assigned --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.room_number}>
                        Room {r.room_number} ({r.room_type} - {r.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    value={formData.admission_date}
                    onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Father (+92 301 9876543)"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="Active">Active Resident</option>
                    <option value="Inactive">Inactive / Checked Out</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update Details' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Drawer/Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-md shadow-blue-500/20">
                  {viewingStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingStudent.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      viewingStudent.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {viewingStudent.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Email Address</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingStudent.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Phone</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingStudent.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <BedDouble size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Hostel Room</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingStudent.room_number ? `Room ${viewingStudent.room_number}` : 'None'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Admission Date</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingStudent.admission_date || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <ShieldAlert size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Emergency Contact</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingStudent.emergency_contact || 'None registered'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="cursor-pointer rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Student Record"
        message="Are you sure you want to remove this resident? All associated allotments will be cleared."
        confirmText="Yes, Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
