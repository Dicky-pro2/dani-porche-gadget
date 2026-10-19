import type { AppUser } from 'cocobase'
import { CocobaseError } from 'cocobase'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getCocobaseClient } from './cocobase.js'
import { sendJson } from './http.js'
import { getSessionToken } from './session.js'

const rateLimitWindow = 15 * 60 * 1000
const failedLogins = new Map<string, number[]>()
export { clearSessionCookie, getSessionToken, setSessionCookie } from './session.js'

export async function authenticateAdmin(email: string, password: string) {
  const client = getCocobaseClient()
  const result = await client.auth.login({ email, password })
  const user = result.user
  const token = client.auth.getToken()
  if (result.requires_2fa || !user || !token || !client.auth.hasRole('admin')) {
    throw new Error('Authentication failed.')
  }
  return { user, token }
}

export async function verifyAdminSession(request: IncomingMessage) {
  const token = getSessionToken(request)
  if (!token) return null
  const client = getCocobaseClient()
  client.auth.setToken(token)
  const user = await client.auth.getCurrentUser()
  return client.auth.hasRole('admin') ? user : null
}

export async function verifyAdminSessionOrRespond(request: IncomingMessage, response: ServerResponse) {
  try {
    const user = await verifyAdminSession(request)
    if (!user) {
      sendJson(response, 401, { error: 'Authentication required.' })
      return null
    }
    return user
  } catch (error) {
    if (error instanceof CocobaseError && (error.statusCode === 401 || error.statusCode === 403)) {
      sendJson(response, 401, { error: 'Authentication required.' })
      return null
    }
    console.error('Admin session verification failed:', error)
    sendJson(response, 502, { error: 'Unable to verify the admin session.' })
    return null
  }
}

export async function loginIsRateLimited(ip: string) {
  const now = Date.now()
  const recent = (failedLogins.get(ip) || []).filter((timestamp) => now - timestamp < rateLimitWindow)
  failedLogins.set(ip, recent)
  if (failedLogins.size > 10_000) {
    for (const [key, timestamps] of failedLogins) {
      const current = timestamps.filter((timestamp) => now - timestamp < rateLimitWindow)
      if (current.length) failedLogins.set(key, current)
      else failedLogins.delete(key)
    }
  }
  return recent.length >= 5
}

export async function recordFailedLogin(ip: string) {
  const now = Date.now()
  const recent = (failedLogins.get(ip) || []).filter((timestamp) => now - timestamp < rateLimitWindow)
  recent.push(now)
  failedLogins.set(ip, recent)
  await new Promise((resolve) => setTimeout(resolve, 500))
}

export function adminUserResponse(user: AppUser) {
  return { email: user.email }
}
