import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { INITIAL_ROOMS } from './dbSeed'

const STORAGE_KEY = 'hostelhub_rooms'

function getLocalRooms() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROOMS))
    return INITIAL_ROOMS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return INITIAL_ROOMS
  }
}

function saveLocalRooms(rooms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
}

export async function getRooms() {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true })

      if (!error && data) return data
      console.warn('Supabase rooms error, using local fallback:', error?.message)
    } catch (err) {
      console.warn('Supabase connection failed, using local storage:', err)
    }
  }
  return getLocalRooms()
}

export async function addRoom(room) {
  const newRoom = {
    ...room,
    id: room.id || `room-${Date.now()}`,
    occupied_beds: Number(room.occupied_beds) || 0,
    capacity: Number(room.capacity) || 1,
    floor: Number(room.floor) || 1,
    monthly_rent: Number(room.monthly_rent) || 0,
    status: room.status || 'Available',
    created_at: new Date().toISOString(),
  }

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([newRoom])
        .select()
        .single()

      if (!error && data) return data
      console.warn('Supabase addRoom error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase addRoom exception:', err)
    }
  }

  const list = getLocalRooms()
  const updated = [newRoom, ...list]
  saveLocalRooms(updated)
  return newRoom
}

export async function updateRoom(id, updates) {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) return data
      console.warn('Supabase updateRoom error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase updateRoom exception:', err)
    }
  }

  const list = getLocalRooms()
  const updatedList = list.map((r) => (r.id === id ? { ...r, ...updates } : r))
  saveLocalRooms(updatedList)
  return updatedList.find((r) => r.id === id)
}

export async function deleteRoom(id) {
  if (hasSupabaseConfig && supabase) {
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (!error) return true
      console.warn('Supabase deleteRoom error, falling back to local:', error?.message)
    } catch (err) {
      console.warn('Supabase deleteRoom exception:', err)
    }
  }

  const list = getLocalRooms()
  const filtered = list.filter((r) => r.id !== id)
  saveLocalRooms(filtered)
  return true
}

export function resetRoomsLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROOMS))
  return INITIAL_ROOMS
}
