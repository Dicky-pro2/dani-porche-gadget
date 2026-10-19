import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { AdminAuthContext } from './AdminAuthContext'
import { getAdminSession, signInAdmin, signOutAdmin } from '../services/adminService'

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getAdminSession()
      .then((user) => {
        if (active) setUserEmail(user.email)
      })
      .catch(() => {
        if (active) setUserEmail(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const user = await signInAdmin(email, password)
      setUserEmail(user.email)
      return null
    } catch (caught) {
      setUserEmail(null)
      return caught instanceof Error ? caught.message : 'Unable to sign in.'
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await signOutAdmin()
    } finally {
      setUserEmail(null)
    }
  }, [])

  const value = useMemo(() => ({
    loading,
    userEmail,
    isAuthenticated: Boolean(userEmail),
    signIn,
    signOut,
  }), [loading, signIn, signOut, userEmail])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
