import type { IncomingMessage, ServerResponse } from 'node:http'
import { getSupabaseClient, isSupabaseConfigured } from '../server/supabase.js'
import { getPublishedProductBySlug, listProductDocuments } from '../server/products.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 405
    response.end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }

  if (!isSupabaseConfigured()) {
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 503
    response.end(JSON.stringify({ error: 'Supabase is not configured.' }))
    return
  }

  try {
    const client = getSupabaseClient()
    const slug = new URL(request.url || '/', 'http://localhost').searchParams.get('slug')
    const products = slug === null ? await listProductDocuments(client, true) : null
    const product = slug === null ? null : await getPublishedProductBySlug(client, slug)

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(slug === null
      ? { products: products ?? [] }
      : { product }))
  } catch (error) {
    console.error('Supabase product request failed:', error)
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 502
    response.end(JSON.stringify({ error: 'Unable to load products.' }))
  }
}
