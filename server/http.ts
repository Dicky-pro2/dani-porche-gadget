import { Buffer } from 'node:buffer'
import type { IncomingMessage, ServerResponse } from 'node:http'

export function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

export function requireJson(request: IncomingMessage) {
  const contentType = request.headers['content-type']
  return typeof contentType === 'string' && contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

export function hasAllowedOrigin(request: IncomingMessage) {
  const origin = request.headers.origin
  if (typeof origin !== 'string') return false
  const forwardedHost = request.headers['x-forwarded-host']
  const host = (typeof forwardedHost === 'string' ? forwardedHost.split(',')[0] : request.headers.host)?.trim()
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function readJson(request: IncomingMessage) {
  if (Number(request.headers['content-length'] || 0) > 64 * 1024) throw new Error('Request body too large.')
  const body = (request as IncomingMessage & { body?: unknown }).body
  if (body !== undefined) {
    if (typeof body === 'string') return JSON.parse(body) as unknown
    return body
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += part.length
    if (size > 64 * 1024) throw new Error('Request body too large.')
    chunks.push(part)
  }
  if (size === 0) return null
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

export function requestIp(request: IncomingMessage) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return request.socket.remoteAddress || 'unknown'
}

export function queryParam(request: IncomingMessage, key: string) {
  return new URL(request.url || '/', 'http://localhost').searchParams.get(key)
}
