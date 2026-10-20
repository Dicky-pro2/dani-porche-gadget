import type { IncomingMessage, ServerResponse } from 'node:http'
import { clearSessionCookie, verifyAdminSessionOrRespond } from '../../server/auth.js'
import { hasAllowedOrigin, requireJson, sendJson } from '../../server/http.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (!await verifyAdminSessionOrRespond(request, response)) return
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
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
  clearSessionCookie(response)
  sendJson(response, 200, { success: true })
}
