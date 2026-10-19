import { BadgeCheck, CircleAlert, FileText, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Product } from '../../data/products'
import { listAdminProducts } from '../../services/adminService'

export function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listAdminProducts()
      .then((items) => {
        if (active) setProducts(items)
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load product counts.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const metrics = [
    { label: 'Total products', value: products.length, icon: Package },
    { label: 'Published', value: products.filter((product) => product.isPublished).length, icon: BadgeCheck },
    { label: 'Drafts', value: products.filter((product) => !product.isPublished).length, icon: FileText },
    { label: 'Out of stock', value: products.filter((product) => product.stock === 0).length, icon: CircleAlert },
  ]

  return (
    <>
      <div className="admin-page-heading"><div><h1>Overview</h1><p>Your shop at a glance.</p></div></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-stats">{metrics.map(({ label, value, icon: Icon }) => <div className="admin-stat" key={label}><span><Icon className="admin-stat-icon" size={13} />{label}</span><strong>{loading ? '…' : error ? '—' : value}</strong></div>)}</div>
      <section className="admin-panel"><h2>Product catalogue</h2><p className="admin-muted">Counts reflect the current CocoBase product collection.</p></section>
    </>
  )
}
