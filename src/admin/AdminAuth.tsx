import { useMemo, useState, type PropsWithChildren } from 'react'
import { AdminAuthContext } from './AdminAuthContext'

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [isPreviewAuthenticated, setPreviewAuthenticated] = useState(false)
  const value = useMemo(() => ({
    isPreviewAuthenticated,
    enterPreview: () => setPreviewAuthenticated(true),
    exitPreview: () => setPreviewAuthenticated(false),
  }), [isPreviewAuthenticated])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
