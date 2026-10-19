import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Product } from '../../data/products'
import { productPath, routes } from '../../constants/routes'
import { formatPrice, stockLabel } from '../../services/whatsappService'
import { listAdminProducts, saveAdminProduct } from '../../services/adminService'

export function AdminProductsPage() {
  const location = useLocation()
  const state = location.state as { message?: unknown } | null
  const notice = typeof state?.message === 'string' ? state.message : null
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    let active = true
    listAdminProducts()
      .then((items) => {
        if (active) setProducts(items)
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load products.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.name} ${product.brand} ${product.category} ${product.reference}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (status === 'all' || (status === 'published') === product.isPublished)
  }), [products, search, status])

  const togglePublished = async (product: Product) => {
    setSavingId(product.id)
    setError(null)
    try {
      const updated = await saveAdminProduct({ ...product, isPublished: !product.isPublished }, product.id)
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update product status.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <div className="admin-page-heading"><div><h1>Products</h1><p>Create and update the products customers can browse.</p></div><Link className="button button-primary" to={`${routes.admin}/${routes.adminProducts}/new`}><Plus size={14} /> ADD PRODUCT</Link></div>
      <div className="admin-actions admin-product-filters">
        <label className="search-field"><Search size={14} /><input aria-label="Search products" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Status <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></label>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      <section className="admin-panel admin-table-wrap">
        {loading ? <p role="status">Loading products…</p> : <table className="admin-table">
          <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>
            {filtered.map((product) => <tr key={product.id}>
              <td><div className="admin-product-cell"><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.reference}</small></span></div></td>
              <td>{product.category}</td>
              <td>{formatPrice(product.price)}</td>
              <td><span className={product.stock <= 3 ? 'stock-label is-low' : 'stock-label'}>{product.stock} · {stockLabel(product.stock)}</span></td>
              <td><span className={`admin-status${product.isPublished ? ' is-published' : ''}`}>{product.isPublished ? 'Published' : 'Draft'}</span></td>
              <td><div className="admin-row-actions"><Link className="text-link" to={`${routes.admin}/${routes.adminProducts}/${encodeURIComponent(product.id)}`}>Edit</Link><button type="button" disabled={savingId === product.id} onClick={() => togglePublished(product)}>{savingId === product.id ? 'Saving…' : product.isPublished ? 'Unpublish' : 'Publish'}</button><Link className="admin-preview-link" to={productPath(product.slug)} target="_blank" rel="noreferrer">View</Link></div></td>
            </tr>)}
            {!filtered.length && <tr><td colSpan={6}><div className="admin-empty">No products match these filters.</div></td></tr>}
          </tbody>
        </table>}
      </section>
    </>
  )
}
