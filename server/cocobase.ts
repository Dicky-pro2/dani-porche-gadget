import { Cocobase } from 'cocobase'

export function isCocobaseConfigured() {
  return Boolean(process.env.COCOBASE_API_KEY)
}

export function getCocobaseClient() {
  const apiKey = process.env.COCOBASE_API_KEY
  if (!apiKey) throw new Error('CocoBase is not configured. Set COCOBASE_API_KEY in the server environment.')

  return new Cocobase({ apiKey })
}

export function getProductsCollection() {
  return process.env.COCOBASE_PRODUCTS_COLLECTION || 'products'
}
