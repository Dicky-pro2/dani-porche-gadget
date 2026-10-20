const allowedFields = new Set([
  'slug', 'name', 'brand', 'category', 'description', 'image', 'reference',
  'badge', 'colors', 'specs', 'price', 'stock', 'isPublished',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanOptionalString(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.trim().length > maxLength) throw new Error(`Invalid ${field}.`)
  return value.trim()
}

function cleanRequiredString(value: unknown, field: string, maxLength: number) {
  const cleaned = cleanOptionalString(value, field, maxLength)
  if (!cleaned) throw new Error(`Invalid ${field}.`)
  return cleaned
}

function normalizeSlug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function cleanShortStrings(value: unknown, field: string) {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 20) throw new Error(`Invalid ${field}.`)
  return value.map((item) => {
    if (typeof item !== 'string' || item.trim().length === 0 || item.trim().length > 60) throw new Error(`Invalid ${field}.`)
    return item.trim()
  })
}

export function validateProductInput(value: unknown, referenceFallback = '') {
  if (!isRecord(value)) throw new Error('Invalid product data.')
  if (Object.keys(value).some((key) => !allowedFields.has(key))) throw new Error('Invalid product data.')

  const name = cleanRequiredString(value.name, 'name', 120)
  const brand = cleanRequiredString(value.brand, 'brand', 80)
  const category = cleanRequiredString(value.category, 'category', 80)
  const description = cleanRequiredString(value.description, 'description', 2000)
  const image = cleanRequiredString(value.image, 'image', 2048)
  let imageUrl: URL
  try {
    imageUrl = new URL(image)
  } catch {
    throw new Error('Invalid image.')
  }
  if (imageUrl.protocol !== 'https:') throw new Error('Invalid image.')

  const inputSlug = cleanOptionalString(value.slug, 'slug', 150)
  const slug = inputSlug || normalizeSlug(name)
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid slug.')
  const price = value.price === undefined || value.price === null || value.price === '' ? null : value.price
  if (price !== null && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) throw new Error('Invalid price.')
  const stock = value.stock
  if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) throw new Error('Invalid stock.')
  if (typeof value.isPublished !== 'boolean') throw new Error('Invalid publication status.')

  return {
    slug,
    name,
    brand,
    category,
    description,
    image: imageUrl.href,
    reference: cleanOptionalString(value.reference, 'reference', 50) || referenceFallback,
    badge: cleanOptionalString(value.badge, 'badge', 50) || null,
    colors: cleanShortStrings(value.colors, 'colors'),
    specs: cleanShortStrings(value.specs, 'specs'),
    price,
    stock,
    isPublished: value.isPublished,
  }
}

export function slugFromName(name: string) {
  return normalizeSlug(name)
}
