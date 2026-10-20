import type { User } from '@supabase/supabase-js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { isAdminUser } from './admin-role.js'
import { getSupabaseClient } from './supabase.js'
import { sendJson } from './http.js'
import { getRefreshToken, getSessionToken, setSessionCookies } from './session.js'

const rateLimitWindow = 15 * 60 * 1000
const failedLogins = new Map<string, number[]>()
export { clearSessionCookies, getRefreshToken, getSessionToken, setSessionCookies } from './session.js'

function errorStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status
  }
  return null
}

export async function authenticateAdmin(email: string, password: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user || !data.session || !isAdminUser(data.user)) {
    throw new Error('Authentication failed.')
  }
  return {
    user: data.user,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  }
}

export async function registerUser(email: string, password: string) {
  const client = getSupabaseClient()
  const { error } = await client.auth.signUp({ email, password })
  if (error) throw error
}

async function verifyAdminSession(request: IncomingMessage, response: ServerResponse) {
  const accessToken = getSessionToken(request)
  const refreshToken = getRefreshToken(request)
  if (!accessToken && !refreshToken) return null

  const client = getSupabaseClient()
  if (accessToken) {
    const { data, error } = await client.auth.getUser(accessToken)
    if (!error && data.user && isAdminUser(data.user)) return { user: data.user, accessToken }
    if (error && errorStatus(error) !== 401 && errorStatus(error) !== 403) throw error
    if (!error && data.user && !isAdminUser(data.user)) return null
  }

  if (!refreshToken) return null
  const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken })
  if (error) {
    if (errorStatus(error) === 400 || errorStatus(error) === 401 || errorStatus(error) === 403) return null
    throw error
  }
  if (!data.user || !data.session || !isAdminUser(data.user)) return null

  setSessionCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in)
  return { user: data.user, accessToken: data.session.access_token }
}

export async function verifyAdminSessionOrRespond(request: IncomingMessage, response: ServerResponse) {
  try {
    const session = await verifyAdminSession(request, response)
    if (!session) {
      sendJson(response, 401, { error: 'Authentication required.' })
      return null
    }
    return session
  } catch (error) {
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

export function adminUserResponse(user: User) {
  return { email: user.email }
}

export function getAdminSupabaseClient(session: { accessToken: string }) {
  return getSupabaseClient(session.accessToken)
}
