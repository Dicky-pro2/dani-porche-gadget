import type { IncomingMessage, ServerResponse } from 'node:http'
import { getProductsCollection, isCocobaseConfigured } from './lib/cocobase.js'
import { listProductDocuments, mapProduct } from './lib/products.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 405
    response.end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }

  if (!isCocobaseConfigured()) {
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 503
    response.end(JSON.stringify({ error: 'CocoBase is not configured.' }))
    return
  }

  try {
    const documents = await listProductDocuments(getProductsCollection())
    const products = documents
      .filter((document) => document.data.isPublished === true)
      .flatMap((document) => {
        const product = mapProduct(document)
        return product ? [product] : []
      })
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    const slug = new URL(request.url || '/', 'http://localhost').searchParams.get('slug')

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(slug === null
      ? { products }
      : { product: products.find((product) => product.slug === slug) ?? null }))
  } catch (error) {
    console.error('CocoBase product request failed:', error)
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 502
    response.end(JSON.stringify({ error: 'Unable to load products.' }))
  }
}
