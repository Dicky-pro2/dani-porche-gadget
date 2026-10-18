import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../AdminAuthContext'
import { routes } from '../../constants/routes'
import { BrandLogo } from '../../components/common/BrandLogo'

export function AdminLoginPage() {
  const { enterPreview } = useAdminAuth()
  const navigate = useNavigate()
  const openPreview = () => {
    enterPreview()
    navigate(routes.admin)
  }
  return (
    <main className="admin-screen">
      <section className="admin-login">
        <BrandLogo />
        <h1>Admin preview</h1>
        <p>Explore the dashboard interface in prototype mode. This preview does not connect to a database or authenticate a real administrator.</p>
        <button className="button button-primary" onClick={openPreview}><LockKeyhole size={15} /> ENTER DESIGN PREVIEW</button>
        <div className="admin-warning">Production admin access is intentionally unavailable until Supabase authentication, role-based authorization, and backend data policies are configured. This preview gate is not a security boundary.</div>
        <Link className="text-link" style={{ marginTop: 20 }} to="/"><ArrowLeft size={13} /> BACK TO STOREFRONT</Link>
      </section>
    </main>
  )
}
