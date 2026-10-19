import type { Document } from 'cocobase'
import { getCocobaseClient } from './cocobase.js'

export type ProductData = Record<string, unknown>
export type ProductDocument = Document<ProductData>

function valueOf(data: ProductData, key: string) {
  return data[key]
}

function stringOf(data: ProductData, key: string, fallback = '') {
  const value = valueOf(data, key)
  return typeof value === 'string' ? value : fallback
}

function stringsOf(data: ProductData, key: string) {
  const value = valueOf(data, key)
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : []
}

export function mapProduct(document: ProductDocument) {
  const data = document.data
  const slug = stringOf(data, 'slug')
  const name = stringOf(data, 'name')
  const brand = stringOf(data, 'brand')
  const category = stringOf(data, 'category')
  const description = stringOf(data, 'description')
  const image = stringOf(data, 'image')
  const published = valueOf(data, 'isPublished') === true

  if (!slug || !name || !brand || !category || !description || !image) {
    if (published) console.warn(`Skipping published product ${document.id}: a required field is missing.`)
    return null
  }

  const price = valueOf(data, 'price')
  const stock = valueOf(data, 'stock')
  const createdAt = stringOf(data, 'createdAt', document.created_at)
  return {
    id: document.id,
    slug,
    name,
    brand,
    category,
    description,
    image,
    reference: stringOf(data, 'reference', document.id),
    badge: stringOf(data, 'badge') || null,
    colors: stringsOf(data, 'colors'),
    specs: stringsOf(data, 'specs'),
    price: typeof price === 'number' ? price : null,
    stock: typeof stock === 'number' ? stock : 0,
    isPublished: published,
    createdAt,
    updatedAt: stringOf(data, 'updatedAt', createdAt),
  }
}

export async function listProductDocuments(collection: string) {
  const client = getCocobaseClient()
  const documents: ProductDocument[] = []
  let offset = 0
  let page: ProductDocument[]
  do {
    page = await client.listDocuments<ProductData>(collection, { limit: 100, offset }) as ProductDocument[]
    documents.push(...page)
    offset += page.length
  } while (page.length === 100)
  return documents
}
