import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { INITIAL_STUDENTS } from './dbSeed'

const STORAGE_KEY = 'hostelhub_students'

function getLocalStudents() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS))
    return INITIAL_STUDENTS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return INITIAL_STUDENTS
  }
}

function saveLocalStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
}

export async function getStudents() {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) return data
      console.warn('Supabase students error, using local fallback:', error?.message)
    } catch (err) {
      console.warn('Supabase connection failed, using local storage:', err)
    }
  }
  return getLocalStudents()
}

export async function addStudent(student) {
  const newStudent = {
    ...student,
    id: student.id || `std-${Date.now()}`,
    status: student.status || 'Active',
    admission_date: student.admission_date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  }

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select()
        .single()

      if (!error && data) return data
      console.warn('Supabase addStudent error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase addStudent exception:', err)
    }
  }

  const list = getLocalStudents()
  const updated = [newStudent, ...list]
  saveLocalStudents(updated)
  return newStudent
}

export async function updateStudent(id, updates) {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) return data
      console.warn('Supabase updateStudent error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase updateStudent exception:', err)
    }
  }

  const list = getLocalStudents()
  const updatedList = list.map((s) => (s.id === id ? { ...s, ...updates } : s))
  saveLocalStudents(updatedList)
  return updatedList.find((s) => s.id === id)
}

export async function deleteStudent(id) {
  if (hasSupabaseConfig && supabase) {
    try {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (!error) return true
      console.warn('Supabase deleteStudent error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase deleteStudent exception:', err)
    }
  }

  const list = getLocalStudents()
  const filtered = list.filter((s) => s.id !== id)
  saveLocalStudents(filtered)
  return true
}

export function resetStudentsLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS))
  return INITIAL_STUDENTS
}
