import { ArrowLeft, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { routes } from '../../constants/routes'
import { BrandLogo } from '../../components/common/BrandLogo'
import { registerAdminAccount } from '../../services/adminService'
import { useAdminAuth } from '../AdminAuthContext'

export function AdminRegisterPage() {
  const { isAuthenticated, loading } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={routes.admin} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      setMessage(await registerAdminAccount(email.trim(), password))
      setPassword('')
      setConfirmPassword('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to register.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-screen">
      <section className="admin-login">
        <BrandLogo />
        <h1>Create an account</h1>
        <p>Register a Supabase account. Registration does not grant administrator access; the shop owner must approve it separately.</p>
        <form onSubmit={handleSubmit}>
          <label className="admin-field" htmlFor="register-email">Email address
            <input id="register-email" autoComplete="email" type="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="admin-field" htmlFor="register-password">Password
            <input id="register-password" autoComplete="new-password" type="password" minLength={8} maxLength={1024} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="admin-field" htmlFor="register-confirm-password">Confirm password
            <input id="register-confirm-password" autoComplete="new-password" type="password" minLength={8} maxLength={1024} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {message && <p className="admin-success" role="status">{message}</p>}
          <button className="button button-primary" type="submit" disabled={submitting || loading}>
            <UserPlus size={15} />{submitting ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p>Already registered? <Link className="text-link" to={routes.adminLogin}>Sign in</Link></p>
        <Link className="text-link admin-back-link" to="/"><ArrowLeft size={13} /> BACK TO STOREFRONT</Link>
      </section>
    </main>
  )
}
