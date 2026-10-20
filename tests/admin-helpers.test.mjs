import assert from 'node:assert/strict'
import test from 'node:test'
import { isAdminUser } from '../server/admin-role.ts'
import { hasAllowedOrigin } from '../server/http.ts'
import { validateRegistrationInput } from '../server/registration.ts'
import { clearSessionCookies, getRefreshToken, getSessionToken, setSessionCookies } from '../server/session.ts'
import { validateProductInput } from '../server/validate.ts'

const validProduct = () => ({
  name: 'Aster X9 Pro',
  brand: 'Aster',
  category: 'Smartphones',
  description: 'A useful phone with a clear display.',
  image: 'https://images.example.com/aster.jpg',
  reference: 'DPG-001',
  badge: '',
  colors: ['Black'],
  specs: ['128GB'],
  price: null,
  stock: 2,
  isPublished: true,
})

test('product validation creates a lowercase slug when omitted', () => {
  const product = validateProductInput(validProduct())
  assert.equal(product.slug, 'aster-x9-pro')
  assert.equal(product.price, null)
  assert.equal(product.stock, 2)
})

test('product validation rejects unknown fields and invalid values', () => {
  assert.throws(() => validateProductInput({ ...validProduct(), admin: true }))
  assert.throws(() => validateProductInput({ ...validProduct(), image: 'http://images.example.com/a.jpg' }))
  assert.throws(() => validateProductInput({ ...validProduct(), price: -1 }))
  assert.throws(() => validateProductInput({ ...validProduct(), stock: 1.5 }))
  assert.throws(() => validateProductInput({ ...validProduct(), slug: 'Bad Slug' }))
})

test('session cookie helpers use the required secure cookie attributes', () => {
  const response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
  }
  setSessionCookies(response, 'access-token', 'refresh-token', 3600)
  assert.match(response.headers['Set-Cookie'][0], /HttpOnly/)
  assert.match(response.headers['Set-Cookie'][0], /Secure/)
  assert.match(response.headers['Set-Cookie'][0], /SameSite=Strict/)
  const cookieRequest = { headers: { cookie: response.headers['Set-Cookie'].map((cookie) => cookie.split(';')[0]).join('; ') } }
  assert.equal(getSessionToken(cookieRequest), 'access-token')
  assert.equal(getRefreshToken(cookieRequest), 'refresh-token')
  clearSessionCookies(response)
  assert.match(response.headers['Set-Cookie'][0], /Max-Age=0/)
  assert.match(response.headers['Set-Cookie'][1], /Max-Age=0/)
})

test('origin check allows request host and rejects missing or different origins', () => {
  assert.equal(hasAllowedOrigin({ headers: { origin: 'https://example.vercel.app', host: 'example.vercel.app' } }), true)
  assert.equal(hasAllowedOrigin({ headers: { origin: 'http://localhost:3000', host: 'localhost:3000' } }), true)
  assert.equal(hasAllowedOrigin({
    headers: {
      origin: 'https://shop.example.com',
      host: 'internal.vercel',
      'x-forwarded-host': 'shop.example.com',
    },
  }), true)
  assert.equal(hasAllowedOrigin({ headers: { origin: 'https://evil.example', host: 'example.vercel.app' } }), false)
  assert.equal(hasAllowedOrigin({ headers: { host: 'example.vercel.app' } }), false)
})

test('administrator access requires trusted Supabase app metadata', () => {
  assert.equal(isAdminUser({ app_metadata: { role: 'admin' } }), true)
  assert.equal(isAdminUser({ app_metadata: { roles: ['admin'] } }), true)
  assert.equal(isAdminUser({ app_metadata: { role: 'admin' }, user_metadata: { role: 'visitor' } }), true)
  assert.equal(isAdminUser({ app_metadata: { role: 'visitor' }, user_metadata: { role: 'admin' } }), false)
  assert.equal(isAdminUser({ app_metadata: { role: 'visitor' } }), false)
})

test('public registration accepts only email and password and grants no role fields', () => {
  assert.deepEqual(validateRegistrationInput({ email: '  user@example.com ', password: 'password123' }), {
    email: 'user@example.com',
    password: 'password123',
  })
  assert.throws(() => validateRegistrationInput({ email: 'user@example.com', password: 'password123', role: 'admin' }))
  assert.throws(() => validateRegistrationInput({ email: 'user@example.com', password: 'short' }))
})
