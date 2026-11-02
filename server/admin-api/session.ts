import type { IncomingMessage, ServerResponse } from 'node:http'
import { adminUserResponse, verifyAdminSession } from '../auth.js'
import { sendJson } from '../http.js'

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const session = await verifyAdminSession(request, response)
    sendJson(response, 200, { user: session ? adminUserResponse(session.user) : null })
  } catch (error) {
    console.error('Admin session verification failed:', error)
    sendJson(response, 502, { error: 'Unable to verify the admin session.' })
  }
}

