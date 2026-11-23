import { supabase, hasSupabaseConfig } from '../lib/supabase'

const BUCKET_NAME = 'hostel-attachments'

/**
 * Upload a file to Supabase Cloud Storage bucket or fallback to Base64 data URL
 * @param {File} file - File object from input
 * @param {string} folder - subfolder name, e.g. 'complaints' or 'avatars'
 * @returns {Promise<{ url: string, path: string, isCloud: boolean, name: string }>}
 */
export async function uploadFile(file, folder = 'complaints') {
  if (!file) throw new Error('No file provided')

  // Validation: Max file size 5MB
  const MAX_SIZE_MB = 5
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size exceeds ${MAX_SIZE_MB}MB limit. Please choose a smaller image.`)
  }

  // Allowed mime types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file format. Please upload JPG, PNG, WEBP, GIF, or PDF.')
  }

  // 1. Try real Supabase Storage if configured
  if (hasSupabaseConfig && supabase) {
    try {
      const fileExt = file.name.split('.').pop()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${cleanName}`

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.warn('Supabase storage upload error, falling back to local storage:', error.message)
      } else if (data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path)

        return {
          url: publicUrlData.publicUrl,
          path: data.path,
          isCloud: true,
          name: file.name,
        }
      }
    } catch (cloudErr) {
      console.warn('Supabase upload exception:', cloudErr)
    }
  }

  // 2. High-fidelity Client-side Data URL Fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        url: reader.result,
        path: `local/${Date.now()}-${file.name}`,
        isCloud: false,
        name: file.name,
      })
    }
    reader.onerror = () => reject(new Error('Failed to read file locally'))
    reader.readAsDataURL(file)
  })
}
