import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product } from '../src/data/products.js'
import type { Database } from './database.types.js'

type ProductRow = Database['public']['Tables']['dpg_products']['Row']
type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

function mapProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    description: row.description,
    image: row.image,
    reference: row.reference,
    badge: row.badge,
    colors: row.colors,
    specs: row.specs,
    price: row.price,
    stock: row.stock,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies Product
}

function toProductRow(product: ProductInput) {
  return {
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
    is_published: product.isPublished,
  }
}

export async function listProductDocuments(client: SupabaseClient<Database>, publishedOnly = false) {
  let query = client.from('dpg_products').select('*').order('created_at', { ascending: false })
  if (publishedOnly) query = query.eq('is_published', true)
  const { data, error } = await query
  if (error) throw error
  return data.map(mapProduct)
}

export async function getPublishedProductBySlug(client: SupabaseClient<Database>, slug: string) {
  const { data, error } = await client
    .from('dpg_products')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}

export async function hasProductSlug(client: SupabaseClient<Database>, slug: string, excludingId?: string) {
  let query = client.from('dpg_products').select('id').eq('slug', slug)
  if (excludingId) query = query.neq('id', excludingId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data !== null
}

export async function getNextProductReference(client: SupabaseClient<Database>) {
  const { count, error } = await client.from('dpg_products').select('id', { count: 'exact', head: true })
  if (error) throw error
  return `DPG-${String((count ?? 0) + 1).padStart(3, '0')}`
}

export async function getProductById(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client.from('dpg_products').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}

export async function createProduct(client: SupabaseClient<Database>, product: ProductInput) {
  const { data, error } = await client.from('dpg_products').insert(toProductRow(product)).select('*').single()
  if (error) throw error
  return mapProduct(data)
}

export async function updateProduct(client: SupabaseClient<Database>, id: string, product: ProductInput) {
  const { data, error } = await client
    .from('dpg_products')
    .update(toProductRow(product))
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}

export async function deleteProduct(client: SupabaseClient<Database>, id: string) {
  const { error } = await client.from('dpg_products').delete().eq('id', id)
  if (error) throw error
}
