import type { IncomingMessage, ServerResponse } from 'node:http'
import { verifyAdminSessionOrRespond } from '../../server/auth.js'
import { getCocobaseClient, getProductsCollection } from '../../server/cocobase.js'
import { hasAllowedOrigin, queryParam, readJson, requireJson, sendJson } from '../../server/http.js'
import { listProductDocuments, mapProduct } from '../../server/products.js'
import { validateProductInput } from '../../server/validate.js'

async function isSlugUnique(slug: string, excludingId?: string) {
  const documents = await listProductDocuments(getProductsCollection())
  return !documents.some((document) => document.id !== excludingId && document.data.slug === slug)
}

async function nextReference() {
  const documents = await listProductDocuments(getProductsCollection())
  return `DPG-${String(documents.length + 1).padStart(3, '0')}`
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (!await verifyAdminSessionOrRespond(request, response)) return
  if (!['POST', 'PUT', 'DELETE'].includes(request.method || '')) {
    response.setHeader('Allow', 'POST, PUT, DELETE')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }
  if (!hasAllowedOrigin(request)) {
    sendJson(response, 403, { error: 'Request origin not allowed.' })
    return
  }
  if (!requireJson(request)) {
    sendJson(response, 415, { error: 'JSON content type required.' })
    return
  }

  try {
    const client = getCocobaseClient()
    const collection = getProductsCollection()
    const id = queryParam(request, 'id')

    if (request.method === 'DELETE') {
      if (!id) {
        sendJson(response, 400, { error: 'A product ID is required.' })
        return
      }
      await client.deleteDocument(collection, id)
      sendJson(response, 200, { success: true })
      return
    }

    const body = await readJson(request)
    const reference = request.method === 'POST' ? await nextReference() : ''
    const product = validateProductInput(body, reference)
    if (!await isSlugUnique(product.slug, request.method === 'PUT' ? id || undefined : undefined)) {
      sendJson(response, 400, { error: 'A product with this slug already exists.' })
      return
    }
    const documents = request.method === 'PUT' && id
      ? await listProductDocuments(collection)
      : []
    const existing = documents.find((document) => document.id === id)
    if (request.method === 'PUT' && (!id || !existing)) {
      sendJson(response, 404, { error: 'Product not found.' })
      return
    }

    const now = new Date().toISOString()
    const data = {
      ...product,
      createdAt: typeof existing?.data.createdAt === 'string' ? existing.data.createdAt : existing?.created_at || now,
      updatedAt: now,
    }
    const saved = request.method === 'POST'
      ? await client.createDocument(collection, data)
      : await client.updateDocument(collection, id || '', data)
    const savedProduct = mapProduct(saved)
    if (!savedProduct) {
      sendJson(response, 502, { error: 'Unable to save product.' })
      return
    }
    sendJson(response, request.method === 'POST' ? 201 : 200, { product: savedProduct })
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && error.message.startsWith('Invalid')) {
      sendJson(response, 400, { error: 'Invalid product data.' })
      return
    }
    console.error('CocoBase product write failed:', error)
    sendJson(response, 502, { error: 'Unable to save product.' })
  }
}
