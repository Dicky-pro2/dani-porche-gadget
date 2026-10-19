import { BarChart3, Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Tags } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAdminAuth } from '../AdminAuthContext'
import { routes } from '../../constants/routes'
import { BrandLogo } from '../../components/common/BrandLogo'

const navItems = [
  { label: 'Overview', path: routes.admin, icon: LayoutDashboard, end: true },
  { label: 'Products', path: `${routes.admin}/${routes.adminProducts}`, icon: Package },
  { label: 'Categories', path: `${routes.admin}/${routes.adminCategories}`, icon: Tags },
  { label: 'Inventory', path: `${routes.admin}/${routes.adminInventory}`, icon: Boxes },
  { label: 'Orders & enquiries', path: `${routes.admin}/${routes.adminOrders}`, icon: ClipboardList },
  { label: 'Sales reports', path: `${routes.admin}/${routes.adminReports}`, icon: BarChart3 },
]

export function AdminLayout() {
  const { signOut, userEmail } = useAdminAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
      navigate(routes.adminLogin, { replace: true })
    } catch {
      setError('Unable to sign out. Please try again.')
    }
  }

  return (
    <div className="admin-screen">
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <BrandLogo />
          <nav className="admin-nav" aria-label="Admin navigation">
            {navItems.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end}><Icon size={15} />{label}</NavLink>)}
          </nav>
          <button className="admin-signout" onClick={handleSignOut}><LogOut size={15} />Sign out</button>
        </aside>
        <main className="admin-content">
          <header className="admin-topbar"><p>Store administration</p><span>{userEmail}</span></header>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
