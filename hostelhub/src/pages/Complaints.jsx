import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  X,
  BedDouble,
  User,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getComplaints,
  addComplaint,
  updateComplaint,
  deleteComplaint,
} from '../services/complaintService'
import { getRooms } from '../services/roomService'
import { uploadFile } from '../services/storageService'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Loader from '../components/common/Loader'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Plumbing', 'Electrical', 'Internet', 'Cleaning', 'Furniture', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUS_LIST = ['Pending', 'In Progress', 'Resolved']

export default function Complaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [statusModalComplaint, setStatusModalComplaint] = useState(null)
  const [viewImageModalUrl, setViewImageModalUrl] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Add Complaint Form state
  const [uploadingFile, setUploadingFile] = useState(false)
  const [filePreview, setFilePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    priority: 'Medium',
    room_number: '',
    student_name: '',
    student_email: '',
    description: '',
  })

  // Status Update state
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: 'In Progress',
    resolution_notes: '',
  })

  const loadData = async () => {
    try {
      const [compData, roomData] = await Promise.all([getComplaints(), getRooms()])
      setComplaints(compData || [])
      setRooms(roomData || [])
    } catch {
      toast.error('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'Plumbing',
      priority: 'Medium',
      room_number: rooms[0]?.room_number || '',
      student_name: user?.displayName || '',
      student_email: user?.email || '',
      description: '',
    })
    setSelectedFile(null)
    setFilePreview(null)
    setIsAddModalOpen(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    setSelectedFile(file)
    const previewUrl = URL.createObjectURL(file)
    setFilePreview(previewUrl)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (filePreview && !filePreview.startsWith('http')) {
      URL.revokeObjectURL(filePreview)
    }
    setFilePreview(null)
  }

  const handleSubmitComplaint = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Please enter a brief complaint title')
      return
    }

    setSubmitting(true)
    let attachmentUrl = ''

    // Upload attachment to Supabase Storage if a file was chosen
    if (selectedFile) {
      setUploadingFile(true)
      try {
        const uploadResult = await uploadFile(selectedFile, 'complaints')
        attachmentUrl = uploadResult.url
        toast.success(
          uploadResult.isCloud
            ? 'Attachment uploaded to Supabase Storage!'
            : 'Attachment saved locally'
        )
      } catch (err) {
        toast.error(`File upload failed: ${err.message}`)
        setUploadingFile(false)
        setSubmitting(false)
        return
      }
      setUploadingFile(false)
    }

    try {
      await addComplaint({
        ...formData,
        attachment_url: attachmentUrl,
        status: 'Pending',
      })
      toast.success('Complaint registered successfully!')
      setIsAddModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStatusModal = (complaint) => {
    setStatusModalComplaint(complaint)
    setStatusUpdateData({
      status: complaint.status || 'Pending',
      resolution_notes: complaint.resolution_notes || '',
    })
  }

  const handleSaveStatus = async (e) => {
    e.preventDefault()
    if (!statusModalComplaint) return

    setSubmitting(true)
    try {
      await updateComplaint(statusModalComplaint.id, {
        status: statusUpdateData.status,
        resolution_notes: statusUpdateData.resolution_notes,
      })
      toast.success(`Complaint status updated to ${statusUpdateData.status}!`)
      setStatusModalComplaint(null)
      loadData()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    try {
      await deleteComplaint(confirmDeleteId)
      toast.success('Complaint removed successfully')
      setConfirmDeleteId(null)
      loadData()
    } catch {
      toast.error('Failed to delete complaint')
    }
  }

  // Filtered list
  const filteredComplaints = complaints.filter((comp) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      comp.title?.toLowerCase().includes(term) ||
      comp.student_name?.toLowerCase().includes(term) ||
      comp.room_number?.toLowerCase().includes(term) ||
      comp.description?.toLowerCase().includes(term)
    const matchesStatus = filterStatus === 'All' || comp.status === filterStatus
    const matchesCategory = filterCategory === 'All' || comp.category === filterCategory
    const matchesPriority = filterPriority === 'All' || comp.priority === filterPriority
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority
  })

  // Summary counts
  const total = complaints.length
  const pending = complaints.filter((c) => c.status === 'Pending').length
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length
  const resolved = complaints.filter((c) => c.status === 'Resolved').length

  if (loading) return <Loader label="Loading maintenance tickets..." size="lg" />

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Maintenance & Complaints
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Report issues, track maintenance tickets, and manage repairs with cloud photos.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-500 transition"
        >
          <Plus size={18} /> File New Complaint
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tickets</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{total}</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ClipboardList size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Review</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pending}</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{inProgress}</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <AlertTriangle size={20} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{resolved}</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by title, student, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
              {STATUS_LIST.map((s) => (
                <option key={s} value={s} className="dark:bg-slate-900">{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer dark:text-white"
            >
              <option value="All" className="dark:bg-slate-900">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer dark:text-white"
            >
              <option value="All" className="dark:bg-slate-900">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="dark:bg-slate-900">{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List Cards */}
      {filteredComplaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No complaints found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            No maintenance records match your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((comp) => {
            const isResolved = comp.status === 'Resolved'
            const isInProgress = comp.status === 'In Progress'

            return (
              <div
                key={comp.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          comp.priority === 'Urgent'
                            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 animate-pulse'
                            : comp.priority === 'High'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
                            : comp.priority === 'Medium'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {comp.priority} Priority
                      </span>

                      {/* Category Badge */}
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {comp.category}
                      </span>

                      {/* Room */}
                      {comp.room_number && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900">
                          <BedDouble size={12} /> Room {comp.room_number}
                        </span>
                      )}

                      {/* Date */}
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(comp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{comp.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{comp.description}</p>

                    {/* Student Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <User size={13} className="text-slate-400" />
                      <span>
                        Reported by <strong className="text-slate-700 dark:text-slate-200">{comp.student_name || 'Resident'}</strong>
                        {comp.student_email && ` (${comp.student_email})`}
                      </span>
                    </div>

                    {/* Resolution Notes if any */}
                    {comp.resolution_notes && (
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-blue-600 dark:text-blue-400" /> Warden Resolution Notes:
                        </span>
                        <p className="mt-1 text-slate-600 dark:text-slate-400 italic">{comp.resolution_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Attachment Preview & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                    {/* Attachment thumbnail if present */}
                    {comp.attachment_url && (
                      <div className="group relative">
                        <img
                          src={comp.attachment_url}
                          alt="Complaint photo"
                          onClick={() => setViewImageModalUrl(comp.attachment_url)}
                          className="h-20 w-28 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer shadow-xs transition hover:brightness-90"
                        />
                        <button
                          type="button"
                          onClick={() => setViewImageModalUrl(comp.attachment_url)}
                          className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white rounded-xl opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    )}

                    {/* Status Pill & Action button */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle2 size={13} />
                        ) : isInProgress ? (
                          <Clock size={13} />
                        ) : (
                          <AlertTriangle size={13} />
                        )}
                        {comp.status}
                      </span>

                      <button
                        onClick={() => handleOpenStatusModal(comp)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        Update
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(comp.id)}
                        title="Delete ticket"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Complaint Modal with Cloud Storage File Upload */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit Maintenance Request</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geyser water not heating in bathroom"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Affected Room
                  </label>
                  <select
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">General Hostel Facility</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.room_number}>
                        Room {r.room_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Student Name
                  </label>
                  <input
                    type="text"
                    placeholder="Resident Name"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the problem in detail to help maintenance staff prepare..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Supabase Storage File Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Attachment / Photo (Supabase Cloud Storage)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Upload an image of the defect (JPG, PNG, WebP up to 5MB).
                </p>

                {filePreview ? (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2">
                    <img
                      src={filePreview}
                      alt="Upload preview"
                      className="max-h-48 w-full rounded-xl object-contain bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute right-4 top-4 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-red-600 transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                    <p className="mt-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-6 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-400 transition">
                    <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Click to choose photo or drag & drop
                    </span>
                    <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                      Files are securely stored in Supabase Storage bucket
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {uploadingFile
                    ? 'Uploading File...'
                    : submitting
                    ? 'Submitting...'
                    : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Update Ticket Status</h3>
              <button
                onClick={() => setStatusModalComplaint(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ticket Status
                </label>
                <select
                  value={statusUpdateData.status}
                  onChange={(e) =>
                    setStatusUpdateData({ ...statusUpdateData, status: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Resolution Notes / Warden Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Electrician fixed wiring and replaced breaker fuse..."
                  value={statusUpdateData.resolution_notes}
                  onChange={(e) =>
                    setStatusUpdateData({ ...statusUpdateData, resolution_notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalComplaint(null)}
                  className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {submitting ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox View Modal */}
      {viewImageModalUrl && (
        <div
          onClick={() => setViewImageModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <button
              onClick={() => setViewImageModalUrl(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/80 p-2 text-white hover:bg-red-600"
            >
              <X size={20} />
            </button>
            <img
              src={viewImageModalUrl}
              alt="Attachment full view"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Maintenance Ticket"
        message="Are you sure you want to delete this complaint record permanently?"
        confirmText="Yes, Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
