import type { Product } from '../data/products'

type ProductsResponse = {
  error?: unknown
  products?: unknown
  product?: unknown
}

async function requestProducts(query = '') {
  const response = await fetch(`/api/products${query}`)
  const body = await response.json() as ProductsResponse
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Unable to load products.')
  }
  return body
}

export async function listPublishedProducts() {
  const body = await requestProducts()
  if (!Array.isArray(body.products)) throw new Error('The product service returned an invalid response.')
  return body.products as Product[]
}

export async function getProductBySlug(slug: string) {
  const body = await requestProducts(`?slug=${encodeURIComponent(slug)}`)
  if (body.product === null) return null
  if (!body.product || typeof body.product !== 'object') throw new Error('The product service returned an invalid response.')
  return body.product as Product
}
