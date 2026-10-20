import type { IncomingMessage, ServerResponse } from 'node:http'
import { getAdminSupabaseClient, verifyAdminSessionOrRespond } from '../../server/auth.js'
import { sendJson } from '../../server/http.js'
import { listProductDocuments } from '../../server/products.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'no-store')
  const session = await verifyAdminSessionOrRespond(request, response)
  if (!session) return
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }
  try {
    const products = await listProductDocuments(getAdminSupabaseClient(session))
    sendJson(response, 200, { products })
  } catch (error) {
    console.error('Supabase admin product list failed:', error)
    sendJson(response, 502, { error: 'Unable to load products.' })
  }
}
