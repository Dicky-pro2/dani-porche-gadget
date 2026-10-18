import { BarChart3, Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Tags } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  const { exitPreview } = useAdminAuth()
  const navigate = useNavigate()
  const signOut = () => {
    exitPreview()
    navigate(routes.adminLogin)
  }
  return (
    <div className="admin-screen">
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <BrandLogo />
          <div className="admin-preview">DESIGN PREVIEW<br />No live shop data connected.</div>
          <nav className="admin-nav" aria-label="Admin navigation">
            {navItems.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end}><Icon size={15} />{label}</NavLink>)}
          </nav>
          <button className="admin-signout" onClick={signOut}><LogOut size={15} />Exit preview</button>
        </aside>
        <main className="admin-content">
          <header className="admin-topbar"><p>Store administration</p><span>Prototype mode · local preview only</span></header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
