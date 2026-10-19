import { Navigate, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAdminAuth } from './AdminAuthContext'
import { routes } from '../constants/routes'

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  if (loading) return <div className="admin-loading" role="status">Checking sign-in…</div>
  if (!isAuthenticated) return <Navigate to={routes.adminLogin} replace />
  return children ?? <Outlet />
}
