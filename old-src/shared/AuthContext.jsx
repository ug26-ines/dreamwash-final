// src/shared/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [role,    setRole]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            const data = snap.data()
            setProfile(data)
            setRole(data.role || null)
          } else {
            // Auth user exists but no Firestore profile — treat as unauthenticated
            setProfile(null)
            setRole(null)
          }
        } catch (err) {
          // Firestore unreachable (offline before any cache) — gracefully degrade
          console.warn('[AuthContext] Profile fetch failed:', err.message)
          setProfile(null)
          setRole(null)
        }
      } else {
        setProfile(null)
        setRole(null)
      }

      setLoading(false)
    })

    return unsub
  }, [])

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  // Client self-registration only (staff accounts created by CEO in dashboard)
  // Phone is required so Firestore rules can match orders by clientPhone field.
  const register = async (email, password, name, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const profileData = {
      email,
      name,
      phone: phone || '',   // stored so Firestore rules can match orders.clientPhone
      role: 'client',
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    // Immediately update local state so the portal renders without waiting
    // for the next onAuthStateChanged cycle
    setProfile(profileData)
    setRole('client')
    return cred
  }

  return (
    <AuthCtx.Provider value={{ user, profile, role, loading, login, logout, register }}>
      {children}
    </AuthCtx.Provider>
  )
}
