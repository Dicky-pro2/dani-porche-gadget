import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categories } from '../../constants/siteConfig'
import { routes } from '../../constants/routes'
import type { Product } from '../../data/products'
import { deleteAdminProduct, listAdminProducts, saveAdminProduct, uploadAdminImage } from '../../services/adminService'
import { ChipInput } from '../components/ChipInput'

type ProductFields = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
type FieldErrors = Partial<Record<keyof ProductFields, string>>

const emptyProduct: ProductFields = {
  slug: '',
  name: '',
  brand: '',
  category: '',
  description: '',
  image: '',
  reference: '',
  badge: null,
  colors: [],
  specs: [],
  price: null,
  stock: 0,
  isPublished: false,
}

export function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fields, setFields] = useState<ProductFields>(emptyProduct)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [priceValue, setPriceValue] = useState('')
  const [stockValue, setStockValue] = useState('0')
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    listAdminProducts()
      .then((products) => {
        const product = products.find((item) => item.id === id)
        if (!product) throw new Error('Product not found.')
        if (active) {
          setFields(product)
          setPriceValue(product.price === null ? '' : String(product.price))
          setStockValue(String(product.stock))
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load product.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  const update = <K extends keyof ProductFields>(key: K, value: ProductFields[K]) => {
    setFields((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const next: FieldErrors = {}
    if (!fields.name.trim()) next.name = 'Enter a product name.'
    if (!fields.brand.trim()) next.brand = 'Enter a brand.'
    if (!fields.category) next.category = 'Choose a category.'
    if (!fields.description.trim()) next.description = 'Enter a description.'
    if (!fields.image.trim() || !/^https:\/\//i.test(fields.image)) next.image = 'Enter an HTTPS image URL or upload an image.'
    if (fields.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) next.slug = 'Use lowercase letters, numbers, and hyphens only.'
    if (priceValue && (!Number.isFinite(Number(priceValue)) || Number(priceValue) < 0)) next.price = 'Enter a price of zero or more.'
    if (!/^\d+$/.test(stockValue) || !Number.isSafeInteger(Number(stockValue))) next.stock = 'Enter a whole number of zero or more.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (!validate()) return
    setSaving(true)
    const input = {
      ...fields,
      name: fields.name.trim(),
      brand: fields.brand.trim(),
      description: fields.description.trim(),
      price: priceValue === '' ? null : Number(priceValue),
      stock: Number(stockValue),
      badge: fields.badge || null,
    }
    try {
      const saved = await saveAdminProduct(input, id)
      setFields(input)
      setSuccess(id ? 'Product updated.' : 'Product created.')
      if (!id) navigate(`${routes.admin}/${routes.adminProducts}/${encodeURIComponent(saved.id)}`, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleImage = async (file?: File) => {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('Choose an image no larger than 4 MB.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      update('image', await uploadAdminImage(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to upload image.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    setError(null)
    try {
      await deleteAdminProduct(id)
      navigate(`${routes.admin}/${routes.adminProducts}`, { replace: true, state: { message: 'Product deleted.' } })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete product.')
      dialog.current?.close()
    } finally {
      setDeleting(false)
    }
  }

  const fieldError = (field: keyof ProductFields) => errors[field] && <span className="admin-field-error" id={`${field}-error`}>{errors[field]}</span>

  if (loading) return <p role="status">Loading product…</p>
  if (error && id && !fields.name) return <div className="admin-error" role="alert">{error}<p><Link to={`${routes.admin}/${routes.adminProducts}`}>Back to products</Link></p></div>

  return (
    <>
      <div className="admin-page-heading">
        <div><Link className="text-link" to={`${routes.admin}/${routes.adminProducts}`}><ArrowLeft size={13} /> Products</Link><h1>{id ? 'Edit product' : 'Add product'}</h1></div>
        {id && <button className="button button-light admin-delete-button" type="button" onClick={() => dialog.current?.showModal()}><Trash2 size={14} /> DELETE</button>}
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}
      <form className="admin-product-form" onSubmit={handleSubmit} noValidate>
        <label className="admin-field" htmlFor="name">Product name
          <input id="name" maxLength={120} value={fields.name} onChange={(event) => update('name', event.target.value)} aria-describedby={errors.name ? 'name-error' : undefined} aria-invalid={Boolean(errors.name)} required />
          {fieldError('name')}
        </label>
        <label className="admin-field" htmlFor="brand">Brand
          <input id="brand" maxLength={80} value={fields.brand} onChange={(event) => update('brand', event.target.value)} aria-describedby={errors.brand ? 'brand-error' : undefined} aria-invalid={Boolean(errors.brand)} required />
          {fieldError('brand')}
        </label>
        <label className="admin-field" htmlFor="category">Category
          <select id="category" value={fields.category} onChange={(event) => update('category', event.target.value)} aria-describedby={errors.category ? 'category-error' : undefined} aria-invalid={Boolean(errors.category)} required>
            <option value="">Choose a category</option>{categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}
          </select>
          {fieldError('category')}
        </label>
        <label className="admin-field admin-field-wide" htmlFor="description">Description
          <textarea id="description" rows={5} maxLength={2000} value={fields.description} onChange={(event) => update('description', event.target.value)} aria-describedby={errors.description ? 'description-error' : undefined} aria-invalid={Boolean(errors.description)} required />
          {fieldError('description')}
        </label>
        <label className="admin-field" htmlFor="price">Price (NGN, optional)
          <input id="price" type="number" min="0" step="1" value={priceValue} onChange={(event) => { setPriceValue(event.target.value); setErrors((current) => ({ ...current, price: undefined })) }} aria-describedby={errors.price ? 'price-error' : undefined} aria-invalid={Boolean(errors.price)} />
          {fieldError('price')}
        </label>
        <label className="admin-field" htmlFor="stock">Stock
          <input id="stock" type="number" min="0" step="1" value={stockValue} onChange={(event) => { setStockValue(event.target.value); setErrors((current) => ({ ...current, stock: undefined })) }} aria-describedby={errors.stock ? 'stock-error' : undefined} aria-invalid={Boolean(errors.stock)} required />
          {fieldError('stock')}
        </label>
        <label className="admin-field" htmlFor="slug">URL slug (optional)
          <input id="slug" maxLength={150} value={fields.slug} onChange={(event) => update('slug', event.target.value)} placeholder="Generated from product name" aria-describedby={errors.slug ? 'slug-error' : undefined} aria-invalid={Boolean(errors.slug)} />
          {fieldError('slug')}
        </label>
        <label className="admin-field" htmlFor="reference">Reference (optional)
          <input id="reference" maxLength={50} value={fields.reference} onChange={(event) => update('reference', event.target.value)} placeholder="DPG-001" />
        </label>
        <label className="admin-field" htmlFor="badge">Badge (optional)
          <input id="badge" maxLength={50} value={fields.badge || ''} onChange={(event) => update('badge', event.target.value || null)} />
        </label>
        <ChipInput id="colors" label="Colors / options" values={fields.colors} onChange={(values) => update('colors', values)} />
        <ChipInput id="specs" label="Specifications" values={fields.specs} onChange={(values) => update('specs', values)} />
        <div className="admin-field admin-field-wide">
          <label htmlFor="image-url">Product image (HTTPS URL)</label>
          <input id="image-url" maxLength={2048} value={fields.image} onChange={(event) => update('image', event.target.value)} aria-describedby={errors.image ? 'image-error' : undefined} aria-invalid={Boolean(errors.image)} />
          {fieldError('image')}
          <label className="admin-upload-label" htmlFor="image-upload"><ImagePlus size={15} /> {uploading ? 'Uploading…' : 'Upload JPEG, PNG, or WebP (max 4 MB)'}</label>
          <input className="admin-file-input" id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => void handleImage(event.target.files?.[0])} />
          {fields.image && <img className="admin-image-preview" src={fields.image} alt="Product image preview" />}
        </div>
        <label className="admin-checkbox admin-field-wide"><input type="checkbox" checked={fields.isPublished} onChange={(event) => update('isPublished', event.target.checked)} /> Publish this product on the storefront</label>
        <div className="admin-form-actions admin-field-wide">
          <button className="button button-primary" type="submit" disabled={saving || uploading}>{saving ? 'SAVING…' : 'SAVE PRODUCT'}</button>
          <Link className="button button-light" to={`${routes.admin}/${routes.adminProducts}`}>CANCEL</Link>
        </div>
      </form>
      <dialog className="admin-confirm-dialog" ref={dialog} aria-labelledby="delete-dialog-title">
        <h2 id="delete-dialog-title">Delete this product?</h2>
        <p>This action cannot be undone.</p>
        <div className="admin-form-actions"><button className="button button-primary" type="button" disabled={deleting} onClick={() => void handleDelete()}>{deleting ? 'DELETING…' : 'DELETE PRODUCT'}</button><button className="button button-light" type="button" onClick={() => dialog.current?.close()}>CANCEL</button></div>
      </dialog>
    </>
  )
}
