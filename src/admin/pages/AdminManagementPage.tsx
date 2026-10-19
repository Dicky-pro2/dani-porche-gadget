import { useEffect, useState } from 'react'
import { categories } from '../../constants/siteConfig'
import type { Product } from '../../data/products'
import { formatPrice } from '../../services/whatsappService'
import { listAdminProducts, saveAdminProduct } from '../../services/adminService'

type Props = { section: 'Categories' | 'Inventory' | 'Orders' | 'Reports' }

export function AdminManagementPage({ section }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(section === 'Categories' || section === 'Inventory')
  const [error, setError] = useState<string | null>(null)
  const [stockValues, setStockValues] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (section !== 'Categories' && section !== 'Inventory') return
    let active = true
    listAdminProducts()
      .then((items) => {
        if (!active) return
        setProducts(items)
        setStockValues(Object.fromEntries(items.map((product) => [product.id, String(product.stock)])))
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
  }, [section])

  const saveStock = async (product: Product) => {
    const nextStock = Number(stockValues[product.id])
    if (!Number.isSafeInteger(nextStock) || nextStock < 0) {
      setError('Stock must be a whole number of zero or more.')
      return
    }
    setSavingId(product.id)
    setError(null)
    setNotice(null)
    const { id, ...rest } = product
    try {
      const updated = await saveAdminProduct({ ...rest, stock: nextStock }, id)
      setProducts((current) => current.map((item) => item.id === id ? updated : item))
      setNotice(`${product.name} stock updated.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save stock.')
    } finally {
      setSavingId(null)
    }
  }

  if (section === 'Orders' || section === 'Reports') {
    return (
      <>
        <div className="admin-page-heading"><div><h1>{section === 'Orders' ? 'Orders & enquiries' : 'Reports'}</h1><p>Customer orders are handled directly by the shop.</p></div></div>
        <section className="admin-panel"><p>Orders happen over WhatsApp, so there are no records here yet.</p></section>
      </>
    )
  }

  if (section === 'Categories') {
    return (
      <>
        <div className="admin-page-heading"><div><h1>Categories</h1><p>Read-only categories configured for the storefront.</p></div></div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <section className="admin-panel admin-table-wrap"><p className="admin-muted">Categories are managed in the site configuration.</p>
          {loading ? <p role="status">Loading categories…</p> : <table className="admin-table"><thead><tr><th>CATEGORY</th><th>PUBLISHED PRODUCTS</th></tr></thead><tbody>
            {categories.map((category) => <tr key={category.name}><td>{category.name}</td><td>{products.filter((product) => product.category === category.name && product.isPublished).length}</td></tr>)}
          </tbody></table>}
        </section>
      </>
    )
  }

  return (
    <>
      <div className="admin-page-heading"><div><h1>Inventory</h1><p>Update stock levels and review items that need attention.</p></div></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      <section className="admin-panel admin-table-wrap">
        {loading ? <p role="status">Loading inventory…</p> : <table className="admin-table"><thead><tr><th>PRODUCT</th><th>REFERENCE</th><th>PRICE</th><th>ON HAND</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
          {products.map((product) => <tr key={product.id} className={product.stock <= 3 ? 'admin-low-stock' : ''}>
            <td>{product.name}</td><td>{product.reference}</td><td>{formatPrice(product.price)}</td>
            <td><input aria-label={`Stock for ${product.name}`} type="number" min="0" step="1" value={stockValues[product.id] ?? ''} onChange={(event) => setStockValues((current) => ({ ...current, [product.id]: event.target.value }))} /></td>
            <td>{product.stock <= 3 ? 'Low stock' : 'In stock'}</td>
            <td><button type="button" disabled={savingId === product.id} onClick={() => void saveStock(product)}>{savingId === product.id ? 'Saving…' : 'Save stock'}</button></td>
          </tr>)}
          {!products.length && <tr><td colSpan={6}><div className="admin-empty">No products are available.</div></td></tr>}
        </tbody></table>}
      </section>
    </>
  )
}
