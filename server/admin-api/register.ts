import type { IncomingMessage, ServerResponse } from 'node:http'
import { registerUser } from '../auth.js'
import { hasAllowedOrigin, readJson, requireJson, sendJson } from '../http.js'
import { validateRegistrationInput } from '../registration.js'

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

  let registration
  try {
    registration = validateRegistrationInput(await readJson(request))
  } catch {
    sendJson(response, 400, { error: 'Enter a valid email and a password with at least 8 characters.' })
    return
  }

  try {
    await registerUser(registration.email, registration.password)
    sendJson(response, 200, {
      message: 'If this address can register, Supabase will send any required confirmation email. An owner must separately grant administrator access.',
    })
  } catch (error) {
    console.error('Supabase account registration failed:', error)
    sendJson(response, 502, { error: 'Unable to register right now. Please try again later.' })
  }
}

