import type { IncomingMessage, ServerResponse } from 'node:http'
import { verifyAdminSessionOrRespond } from '../lib/auth.js'
import { getProductsCollection } from '../lib/cocobase.js'
import { sendJson } from '../lib/http.js'
import { listProductDocuments, mapProduct } from '../lib/products.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (!await verifyAdminSessionOrRespond(request, response)) return
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }
  try {
    const products = (await listProductDocuments(getProductsCollection()))
      .map(mapProduct)
      .filter((product) => product !== null)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    sendJson(response, 200, { products })
  } catch (error) {
    console.error('CocoBase admin product list failed:', error)
    sendJson(response, 502, { error: 'Unable to load products.' })
  }
}
