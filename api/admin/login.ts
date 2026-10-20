import type { IncomingMessage, ServerResponse } from 'node:http'
import { authenticateAdmin, adminUserResponse, recordFailedLogin, setSessionCookies, loginIsRateLimited } from '../../server/auth.js'
import { hasAllowedOrigin, readJson, requestIp, requireJson, sendJson } from '../../server/http.js'

function statusOf(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status
  }
  return null
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'no-store')
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

  const ip = requestIp(request)
  if (await loginIsRateLimited(ip)) {
    sendJson(response, 429, { error: 'Too many sign-in attempts. Try again later.' })
    return
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    sendJson(response, 400, { error: 'Invalid sign-in request.' })
    return
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    sendJson(response, 400, { error: 'Invalid sign-in request.' })
    return
  }
  const data = body as Record<string, unknown>
  if (Object.keys(data).some((key) => key !== 'email' && key !== 'password')) {
    sendJson(response, 400, { error: 'Invalid sign-in request.' })
    return
  }
  if (typeof data.email !== 'string' || typeof data.password !== 'string' || data.email.length > 254 || data.password.length > 1024) {
    sendJson(response, 400, { error: 'Invalid sign-in request.' })
    return
  }

  try {
    const { user, accessToken, refreshToken, expiresIn } = await authenticateAdmin(data.email.trim(), data.password)
    setSessionCookies(response, accessToken, refreshToken, expiresIn)
    sendJson(response, 200, { user: adminUserResponse(user) })
  } catch (error) {
    const status = statusOf(error)
    if (status === 429) {
      sendJson(response, 429, { error: 'Too many sign-in attempts. Try again later.' })
      return
    }
    const invalidCredentials = error instanceof Error && error.message === 'Authentication failed.'
      || status === 400
      || status === 401
    if (!invalidCredentials) {
      console.error('Admin sign-in failed:', error)
      sendJson(response, 502, { error: 'Unable to sign in right now.' })
      return
    }
    await recordFailedLogin(ip)
    sendJson(response, 401, { error: 'Invalid email or password, or this account is not an administrator.' })
  }
}
