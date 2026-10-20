import type { IncomingMessage, ServerResponse } from 'node:http'

const accessCookieName = 'dpg_admin_access'
const refreshCookieName = 'dpg_admin_refresh'
const sessionDurationSeconds = 12 * 60 * 60

function getCookieValue(request: IncomingMessage, name: string) {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return null
  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=')
    if (separator < 0) continue
    if (entry.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(entry.slice(separator + 1).trim())
      } catch {
        return null
      }
    }
  }
  return null
}

export function getSessionToken(request: IncomingMessage) {
  return getCookieValue(request, accessCookieName)
}

export function getRefreshToken(request: IncomingMessage) {
  return getCookieValue(request, refreshCookieName)
}

export function setSessionCookies(response: ServerResponse, accessToken: string, refreshToken: string, expiresIn: number) {
  const accessMaxAge = Math.max(60, Math.min(expiresIn, sessionDurationSeconds))
  response.setHeader('Set-Cookie', [
    `${accessCookieName}=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${accessMaxAge}`,
    `${refreshCookieName}=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionDurationSeconds}`,
  ])
}

export function clearSessionCookies(response: ServerResponse) {
  response.setHeader('Set-Cookie', [
    `${accessCookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    `${refreshCookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
  ])
}
