import { Navigate, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAdminAuth } from './AdminAuthContext'
import { routes } from '../constants/routes'

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isPreviewAuthenticated } = useAdminAuth()
  if (!isPreviewAuthenticated) return <Navigate to={routes.adminLogin} replace />
  return children ?? <Outlet />
}
