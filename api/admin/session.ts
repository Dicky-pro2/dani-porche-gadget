import type { IncomingMessage, ServerResponse } from 'node:http'
import { adminUserResponse, verifyAdminSessionOrRespond } from '../../server/auth.js'
import { sendJson } from '../../server/http.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const user = await verifyAdminSessionOrRespond(request, response)
  if (!user) return
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }
  sendJson(response, 200, { user: adminUserResponse(user) })
}
