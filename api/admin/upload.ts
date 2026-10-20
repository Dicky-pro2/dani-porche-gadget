import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getAdminSupabaseClient, verifyAdminSessionOrRespond } from '../../server/auth.js'
import { hasAllowedOrigin, sendJson } from '../../server/http.js'

const maxFileBytes = 4 * 1024 * 1024
const storageBucket = 'product-images'

async function readImageBytes(request: IncomingMessage) {
  const body = (request as IncomingMessage & { body?: unknown }).body
  if (Buffer.isBuffer(body)) {
    if (body.length > maxFileBytes) throw new Error('Too large.')
    return body
  }
  if (body !== undefined) throw new Error('Invalid image body.')

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += part.length
    if (size > maxFileBytes) throw new Error('Too large.')
    chunks.push(part)
  }
  return Buffer.concat(chunks)
}

function detectImageType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

function imageExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  return 'webp'
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const session = await verifyAdminSessionOrRespond(request, response)
  if (!session) return
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }
  if (!hasAllowedOrigin(request)) {
    sendJson(response, 403, { error: 'Request origin not allowed.' })
    return
  }

  const mimeType = typeof request.headers['content-type'] === 'string'
    ? request.headers['content-type'].split(';', 1)[0].trim().toLowerCase()
    : ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    sendJson(response, 400, { error: 'Choose a JPEG, PNG, or WebP image.' })
    return
  }
  const declaredLength = Number(request.headers['content-length'] || 0)
  if (declaredLength > maxFileBytes) {
    sendJson(response, 413, { error: 'Image must be 4 MB or smaller.' })
    return
  }

  try {
    const bytes = await readImageBytes(request)
    const detectedType = detectImageType(bytes)
    if (!detectedType || detectedType !== mimeType) {
      sendJson(response, 400, { error: 'Image content does not match its file type.' })
      return
    }
    const path = `products/${randomUUID()}.${imageExtension(detectedType)}`
    const client = getAdminSupabaseClient(session)
    const { error } = await client.storage.from(storageBucket).upload(path, bytes, {
      cacheControl: '31536000',
      contentType: detectedType,
      upsert: false,
    })
    if (error) throw error
    const { data } = client.storage.from(storageBucket).getPublicUrl(path)
    const url = new URL(data.publicUrl)
    if (url.protocol !== 'https:') throw new Error('Invalid storage URL.')
    sendJson(response, 200, { url: url.href })
  } catch (error) {
    if (error instanceof Error && error.message === 'Too large.') {
      sendJson(response, 413, { error: 'Image must be 4 MB or smaller.' })
      return
    }
    if (error instanceof Error && error.message === 'Invalid image body.') {
      sendJson(response, 400, { error: 'Invalid image upload.' })
      return
    }
    console.error('Supabase image upload failed:', error)
    sendJson(response, 502, { error: 'Unable to upload image.' })
  }
}
