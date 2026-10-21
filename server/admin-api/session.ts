import type { IncomingMessage, ServerResponse } from 'node:http'
import { adminUserResponse, verifyAdminSessionOrRespond } from '../auth.js'
import { sendJson } from '../http.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const session = await verifyAdminSessionOrRespond(request, response)
  if (!session) return
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }
  sendJson(response, 200, { user: adminUserResponse(session.user) })
}

