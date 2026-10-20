import assert from 'node:assert/strict'
import test from 'node:test'
import { hasAllowedOrigin } from '../server/http.ts'
import { clearSessionCookie, getSessionToken, setSessionCookie } from '../server/session.ts'
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
  setSessionCookie(response, 'signed-token')
  assert.match(response.headers['Set-Cookie'], /HttpOnly/)
  assert.match(response.headers['Set-Cookie'], /Secure/)
  assert.match(response.headers['Set-Cookie'], /SameSite=Strict/)
  assert.equal(getSessionToken({ headers: { cookie: response.headers['Set-Cookie'].split(';')[0] } }), 'signed-token')
  clearSessionCookie(response)
  assert.match(response.headers['Set-Cookie'], /Max-Age=0/)
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
