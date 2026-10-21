import assert from 'node:assert/strict'
import test from 'node:test'
import { adminActions, resolveAdminHandler } from '../server/admin-api/routes.ts'

test('admin router resolves every existing admin endpoint', () => {
  const handlers = Object.fromEntries(adminActions.map((action) => [action, action]))
  for (const action of adminActions) {
    assert.equal(resolveAdminHandler(handlers, action), action)
  }
})

test('admin router rejects missing, unknown, and nested dispatch names', () => {
  const handlers = Object.fromEntries(adminActions.map((action) => [action, action]))
  assert.equal(resolveAdminHandler(handlers, null), undefined)
  assert.equal(resolveAdminHandler(handlers, 'unknown'), undefined)
  assert.equal(resolveAdminHandler(handlers, 'login/extra'), undefined)
})

