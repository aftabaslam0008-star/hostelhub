import { createContext, useContext, useEffect, useState } from 'react'
import {
  auth,
  hasFirebaseConfig,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from '../lib/firebase'

const DEMO_USERS_KEY = 'hostelhub_demo_users'
const CURRENT_USER_KEY = 'hostelhub_auth_user'

const INITIAL_DEMO_USERS = [
  {
    uid: 'demo-admin-uid',
    email: 'admin@hostelhub.com',
    password: 'admin123',
    displayName: 'Hostel Admin Warden',
    role: 'Admin',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    uid: 'demo-student-uid',
    email: 'alex.morgan@hostelhub.com',
    password: 'student123',
    displayName: 'Alex Morgan',
    role: 'Student',
    roomNumber: '201',
    photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
  },
]

function getLocalDemoUsers() {
  const stored = localStorage.getItem(DEMO_USERS_KEY)
  if (!stored) {
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(INITIAL_DEMO_USERS))
    return INITIAL_DEMO_USERS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return INITIAL_DEMO_USERS
  }
}

const AuthContext = createContext({
  user: null,
  loading: true,
  isDemoMode: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  demoLogin: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(!hasFirebaseConfig)

  useEffect(() => {
    // 1. If Firebase is configured, listen to Firebase Auth changes
    if (hasFirebaseConfig && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const role = firebaseUser.email?.includes('admin') ? 'Admin' : 'Student'
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL || null,
            role,
          })
          setIsDemoMode(false)
        } else {
          // Check if local demo user is logged in
          const savedLocal = localStorage.getItem(CURRENT_USER_KEY)
          if (savedLocal) {
            try {
              setUser(JSON.parse(savedLocal))
              setIsDemoMode(true)
            } catch {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
        setLoading(false)
      })
      return () => unsubscribe()
    }

    // 2. Fallback to Local Auth if Firebase is not yet configured
    const savedLocal = localStorage.getItem(CURRENT_USER_KEY)
    if (savedLocal) {
      try {
        setUser(JSON.parse(savedLocal))
      } catch {
        setUser(null)
      }
    } else {
      // Default to logged-in Admin for smooth instant viewing/demo
      const defaultUser = INITIAL_DEMO_USERS[0]
      setUser(defaultUser)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser))
    }
    setIsDemoMode(true)
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      if (hasFirebaseConfig && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const fbUser = userCredential.user
        const role = email.includes('admin') ? 'Admin' : 'Student'
        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL || null,
          role,
        }
        setUser(userData)
        setIsDemoMode(false)
        setLoading(false)
        return userData
      }

      // Demo/Local login
      const demoUsers = getLocalDemoUsers()
      const found = demoUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )

      if (!found) {
        throw new Error('Invalid email or password. You can use the Quick Demo buttons below.')
      }

      const userData = {
        uid: found.uid,
        email: found.email,
        displayName: found.displayName,
        role: found.role || 'Student',
        photoURL: found.photoURL || null,
        roomNumber: found.roomNumber || null,
      }

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData))
      setUser(userData)
      setIsDemoMode(true)
      setLoading(false)
      return userData
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  const register = async (email, password, displayName, role = 'Student') => {
    setLoading(true)
    try {
      if (hasFirebaseConfig && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const fbUser = userCredential.user
        if (displayName) {
          await updateProfile(fbUser, { displayName })
        }
        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName || email.split('@')[0],
          photoURL: null,
          role,
        }
        setUser(userData)
        setIsDemoMode(false)
        setLoading(false)
        return userData
      }

      // Demo/Local register
      const demoUsers = getLocalDemoUsers()
      if (demoUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An account with this email already exists.')
      }

      const newUser = {
        uid: `user-${Date.now()}`,
        email,
        password,
        displayName: displayName || email.split('@')[0],
        role,
        photoURL: null,
      }

      demoUsers.push(newUser)
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(demoUsers))
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser))
      setUser(newUser)
      setIsDemoMode(true)
      setLoading(false)
      return newUser
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  const logout = async () => {
    try {
      if (hasFirebaseConfig && auth) {
        await signOut(auth)
      }
    } catch (err) {
      console.warn('Firebase signout error:', err)
    } finally {
      localStorage.removeItem(CURRENT_USER_KEY)
      setUser(null)
    }
  }

  const updateUserProfile = async (updates) => {
    if (!user) return
    const updated = { ...user, ...updates }
    if (hasFirebaseConfig && auth?.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName || auth.currentUser.displayName,
          photoURL: updates.photoURL || auth.currentUser.photoURL,
        })
      } catch (err) {
        console.warn('Firebase profile update error:', err)
      }
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated))
    setUser(updated)
    return updated
  }

  const demoLogin = (role = 'admin') => {
    const demoUsers = getLocalDemoUsers()
    const target =
      role === 'admin'
        ? demoUsers.find((u) => u.role === 'Admin') || INITIAL_DEMO_USERS[0]
        : demoUsers.find((u) => u.role === 'Student') || INITIAL_DEMO_USERS[1]

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(target))
    setUser(target)
    setIsDemoMode(true)
    return target
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        login,
        register,
        logout,
        updateUserProfile,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
