import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const [exportPath] = process.argv.slice(2)
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!exportPath) throw new Error('Usage: node scripts/import-cocobase-products.mjs <cocobase-export.json>')
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local environment.')
}

const parsed = JSON.parse(await readFile(exportPath, 'utf8'))
const documents = Array.isArray(parsed) ? parsed : parsed?.documents
if (!Array.isArray(documents)) throw new Error('Export must be an array of CocoBase documents or an object with a documents array.')
if (documents.length === 0) throw new Error('The export contains no documents.')

function requiredString(value, field, documentId) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Document ${documentId} has no valid ${field}.`)
  }
  return value.trim()
}

function optionalTimestamp(value, fallback, field, documentId) {
  const timestamp = typeof value === 'string' ? value : fallback
  if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`Document ${documentId} has no valid ${field} timestamp.`)
  }
  return new Date(timestamp).toISOString()
}

const products = documents.map((document, index) => {
  const id = typeof document?.id === 'string' || typeof document?.id === 'number'
    ? String(document.id)
    : ''
  const data = document?.data
  if (!id || !data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Export document ${index + 1} has an invalid ID or data object.`)
  }

  const slug = requiredString(data.slug, 'slug', id)
  const name = requiredString(data.name, 'name', id)
  const brand = requiredString(data.brand, 'brand', id)
  const category = requiredString(data.category, 'category', id)
  const description = requiredString(data.description, 'description', id)
  const image = requiredString(data.image, 'image', id)
  let imageUrl
  try {
    imageUrl = new URL(image)
  } catch {
    throw new Error(`Document ${id} has an invalid image URL.`)
  }
  if (imageUrl.protocol !== 'https:') throw new Error(`Document ${id} has a non-HTTPS image URL.`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Document ${id} has an invalid slug.`)
  if (data.price !== undefined && data.price !== null && (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0)) {
    throw new Error(`Document ${id} has an invalid price.`)
  }
  if (data.stock !== undefined && (typeof data.stock !== 'number' || !Number.isInteger(data.stock) || data.stock < 0)) {
    throw new Error(`Document ${id} has invalid stock.`)
  }
  if (data.isPublished !== undefined && typeof data.isPublished !== 'boolean') {
    throw new Error(`Document ${id} has an invalid publication status.`)
  }

  const createdAt = optionalTimestamp(data.createdAt, document.created_at, 'created', id)
  return {
    id,
    slug,
    name,
    brand,
    category,
    description,
    image: imageUrl.href,
    reference: typeof data.reference === 'string' && data.reference ? data.reference : id,
    badge: typeof data.badge === 'string' && data.badge ? data.badge : null,
    colors: Array.isArray(data.colors) && data.colors.every((value) => typeof value === 'string') ? data.colors : [],
    specs: Array.isArray(data.specs) && data.specs.every((value) => typeof value === 'string') ? data.specs : [],
    price: typeof data.price === 'number' ? data.price : null,
    stock: typeof data.stock === 'number' ? data.stock : 0,
    is_published: data.isPublished === true,
    created_at: createdAt,
    updated_at: optionalTimestamp(data.updatedAt, createdAt, 'updated', id),
  }
})

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

for (let start = 0; start < products.length; start += 100) {
  const batch = products.slice(start, start + 100)
  const { error } = await supabase
    .from('dpg_products')
    .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(`Product import failed at batch ${Math.floor(start / 100) + 1}: ${error.message}`)
}

console.log(`Processed ${products.length} exported products; existing destination rows were preserved.`)
