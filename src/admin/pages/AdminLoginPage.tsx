import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { routes } from '../../constants/routes'
import { BrandLogo } from '../../components/common/BrandLogo'
import { useAdminAuth } from '../AdminAuthContext'

export function AdminLoginPage() {
  const { isAuthenticated, loading, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={routes.admin} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const failure = await signIn(email.trim(), password)
    setSubmitting(false)
    if (failure) setError(failure)
    else navigate(routes.admin, { replace: true })
  }

  return (
    <main className="admin-screen">
      <section className="admin-login">
        <BrandLogo />
        <h1>Admin sign in</h1>
        <p>Sign in with your shop administrator account.</p>
        <form onSubmit={handleSubmit}>
          <label className="admin-field" htmlFor="admin-email">Email address
            <input id="admin-email" autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="admin-field" htmlFor="admin-password">Password
            <input id="admin-password" autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={submitting || loading}>
            <LockKeyhole size={15} />{submitting ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
        <p>Need an account? <Link className="text-link" to={routes.adminRegister}>Register</Link>. Administrator access requires owner approval.</p>
        <Link className="text-link admin-back-link" to="/"><ArrowLeft size={13} /> BACK TO STOREFRONT</Link>
      </section>
    </main>
  )
}
