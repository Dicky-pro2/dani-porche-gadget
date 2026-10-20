import type { Product } from '../data/products'

type AdminUser = { email: string }
type AdminResponse = {
  error?: unknown
  products?: unknown
  product?: unknown
  user?: unknown
  url?: unknown
  success?: unknown
}

async function apiRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, credentials: 'same-origin', cache: 'no-store' })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    if (response.status === 404) {
      throw new Error('The admin API route was not found. Redeploy the latest project with the repository root as the Vercel root directory.')
    }
    throw new Error(`The server returned a non-JSON response (HTTP ${response.status}). Check the Vercel function logs.`)
  }

  let body: AdminResponse
  try {
    body = await response.json() as AdminResponse
  } catch {
    throw new Error(`The server returned invalid JSON (HTTP ${response.status}). Check the Vercel function logs.`)
  }
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'The request could not be completed.')
  return body
}

export async function getAdminSession() {
  const body = await apiRequest('/api/admin/session')
  if (!body.user || typeof body.user !== 'object' || !('email' in body.user) || typeof body.user.email !== 'string') {
    throw new Error('The server returned an invalid session.')
  }
  return body.user as AdminUser
}

export async function signInAdmin(email: string, password: string) {
  const body = await apiRequest('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!body.user || typeof body.user !== 'object' || !('email' in body.user) || typeof body.user.email !== 'string') {
    throw new Error('The server returned an invalid session.')
  }
  return body.user as AdminUser
}

export async function signOutAdmin() {
  await apiRequest('/api/admin/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
}

export async function listAdminProducts() {
  const body = await apiRequest('/api/admin/products')
  if (!Array.isArray(body.products)) throw new Error('The server returned an invalid product list.')
  return body.products as Product[]
}

export async function saveAdminProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, id?: string) {
  const data = {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    image: product.image,
    reference: product.reference,
    badge: product.badge,
    colors: product.colors,
    specs: product.specs,
    price: product.price,
    stock: product.stock,
    isPublished: product.isPublished,
  }
  const body = await apiRequest(`/api/admin/product${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!body.product || typeof body.product !== 'object') throw new Error('The server returned an invalid product.')
  return body.product as Product
}

export async function deleteAdminProduct(id: string) {
  await apiRequest(`/api/admin/product?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function uploadAdminImage(file: File) {
  const body = await apiRequest('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      'X-File-Name': file.name,
    },
    body: file,
  })
  if (typeof body.url !== 'string') throw new Error('The server returned an invalid image URL.')
  return body.url
}
