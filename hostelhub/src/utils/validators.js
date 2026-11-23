export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

export function isRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function isValidPhone(phone) {
  if (!phone) return true // optional in some forms
  return /^[\d\s+()-]{7,20}$/.test(String(phone).trim())
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6
}
