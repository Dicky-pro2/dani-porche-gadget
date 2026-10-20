import type { IncomingMessage, ServerResponse } from 'node:http'
import { getAdminSupabaseClient, verifyAdminSessionOrRespond } from '../../server/auth.js'
import { hasAllowedOrigin, queryParam, readJson, requireJson, sendJson } from '../../server/http.js'
import { createProduct, deleteProduct, getNextProductReference, getProductById, hasProductSlug, updateProduct } from '../../server/products.js'
import { validateProductInput } from '../../server/validate.js'

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const session = await verifyAdminSessionOrRespond(request, response)
  if (!session) return
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

  const id = queryParam(request, 'id')
  try {
    const client = getAdminSupabaseClient(session)
    if (request.method === 'DELETE') {
      if (!id) {
        sendJson(response, 400, { error: 'A product ID is required.' })
        return
      }
      await deleteProduct(client, id)
      sendJson(response, 200, { success: true })
      return
    }

    const body = await readJson(request)
    const existing = request.method === 'PUT' && id ? await getProductById(client, id) : null
    if (request.method === 'PUT' && (!id || !existing)) {
      sendJson(response, 404, { error: 'Product not found.' })
      return
    }
    const reference = request.method === 'POST' ? await getNextProductReference(client) : ''
    const product = validateProductInput(body, reference)
    if (await hasProductSlug(client, product.slug, request.method === 'PUT' ? id || undefined : undefined)) {
      sendJson(response, 400, { error: 'A product with this slug already exists.' })
      return
    }

    const saved = request.method === 'POST'
      ? await createProduct(client, product)
      : await updateProduct(client, id || '', product)
    if (!saved) {
      sendJson(response, 404, { error: 'Product not found.' })
      return
    }
    sendJson(response, request.method === 'POST' ? 201 : 200, { product: saved })
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && error.message.startsWith('Invalid')) {
      sendJson(response, 400, { error: 'Invalid product data.' })
      return
    }
    if (isUniqueViolation(error)) {
      sendJson(response, 400, { error: 'A product with this slug already exists.' })
      return
    }
    console.error('Supabase product write failed:', error)
    sendJson(response, 502, { error: 'Unable to save product.' })
  }
}
