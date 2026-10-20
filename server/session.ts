import type { IncomingMessage, ServerResponse } from 'node:http'

const cookieName = 'dpg_admin_session'
const sessionDurationSeconds = 12 * 60 * 60

function getCookieValue(request: IncomingMessage, name: string) {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return null
  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=')
    if (separator < 0) continue
    if (entry.slice(0, separator).trim() === name) return decodeURIComponent(entry.slice(separator + 1).trim())
  }
  return null
}

export function getSessionToken(request: IncomingMessage) {
  return getCookieValue(request, cookieName)
}

export function setSessionCookie(response: ServerResponse, token: string) {
  response.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionDurationSeconds}`)
}

export function clearSessionCookie(response: ServerResponse) {
  response.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)
}
