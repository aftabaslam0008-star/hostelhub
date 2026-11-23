import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { INITIAL_COMPLAINTS } from './dbSeed'

const STORAGE_KEY = 'hostelhub_complaints'

function getLocalComplaints() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS))
    return INITIAL_COMPLAINTS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return INITIAL_COMPLAINTS
  }
}

function saveLocalComplaints(complaints) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints))
}

export async function getComplaints() {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) return data
      console.warn('Supabase complaints error, using local fallback:', error?.message)
    } catch (err) {
      console.warn('Supabase connection failed, using local storage:', err)
    }
  }
  return getLocalComplaints()
}

export async function addComplaint(complaint) {
  const newComplaint = {
    ...complaint,
    id: complaint.id || `comp-${Date.now()}`,
    status: complaint.status || 'Pending',
    priority: complaint.priority || 'Medium',
    category: complaint.category || 'Other',
    resolution_notes: complaint.resolution_notes || '',
    created_at: new Date().toISOString(),
  }

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert([newComplaint])
        .select()
        .single()

      if (!error && data) return data
      console.warn('Supabase addComplaint error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase addComplaint exception:', err)
    }
  }

  const list = getLocalComplaints()
  const updated = [newComplaint, ...list]
  saveLocalComplaints(updated)
  return newComplaint
}

export async function updateComplaint(id, updates) {
  const finalUpdates = { ...updates }
  if (updates.status === 'Resolved' && !updates.resolved_at) {
    finalUpdates.resolved_at = new Date().toISOString()
  }

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) return data
      console.warn('Supabase updateComplaint error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase updateComplaint exception:', err)
    }
  }

  const list = getLocalComplaints()
  const updatedList = list.map((c) => (c.id === id ? { ...c, ...finalUpdates } : c))
  saveLocalComplaints(updatedList)
  return updatedList.find((c) => c.id === id)
}

export async function deleteComplaint(id) {
  if (hasSupabaseConfig && supabase) {
    try {
      const { error } = await supabase.from('complaints').delete().eq('id', id)
      if (!error) return true
      console.warn('Supabase deleteComplaint error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase deleteComplaint exception:', err)
    }
  }

  const list = getLocalComplaints()
  const filtered = list.filter((c) => c.id !== id)
  saveLocalComplaints(filtered)
  return true
}

export function resetComplaintsLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS))
  return INITIAL_COMPLAINTS
}
