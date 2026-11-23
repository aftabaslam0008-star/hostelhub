import { createClient } from '@supabase/supabase-js'
import { auth } from './firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')
)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey, {
      accessToken: async () => {
        const user = auth?.currentUser
        if (!user) return null
        return user.getIdToken()
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export async function testSupabaseConnection() {
  if (!supabase) return { connected: false, message: 'Supabase credentials not configured' }
  try {
    const { error } = await supabase.from('rooms').select('count', { count: 'exact', head: true })
    if (error) {
      return { connected: false, message: error.message }
    }
    return { connected: true, message: 'Successfully connected to Supabase PostgreSQL' }
  } catch (err) {
    return { connected: false, message: err.message || 'Connection failed' }
  }
}
