import { ArrowRight, Database, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routes } from '../../constants/routes'

const metrics = [
  { label: 'Recorded sales', value: '—', icon: TrendingUp },
  { label: 'Products', value: '—', icon: Package },
  { label: 'Open enquiries', value: '—', icon: Users },
  { label: 'Orders', value: '—', icon: ShoppingBag },
]

export function AdminDashboardPage() {
  return (
    <>
      <div className="admin-page-heading"><div><h1>Overview</h1><p>Your shop at a glance.</p></div><span className="product-label">PREVIEW</span></div>
      <div className="admin-warning dashboard-warning">No database is connected. Figures and inventory are intentionally not fabricated; live summaries will appear when real records are available.</div>
      <div className="admin-stats">{metrics.map(({ label, value, icon: Icon }) => <div className="admin-stat" key={label}><span><Icon className="admin-stat-icon" size={13} />{label}</span><strong>{value}</strong></div>)}</div>
      <section className="admin-panel"><h2>Recent activity</h2><div className="admin-empty">      <div><Database size={20} /><p>Connect Supabase to see recorded orders, enquiries, stock, and sales here.</p><Link className="text-link" to={`${routes.admin}/${routes.adminProducts}`}>OPEN PRODUCT MANAGEMENT <ArrowRight size={13} /></Link></div></div></section>
    </>
  )
}
