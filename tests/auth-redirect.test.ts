import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeNextPath } from '../src/lib/auth-redirect'

test('mantém um caminho interno válido', () => {
  assert.equal(sanitizeNextPath('/reset-password'), '/reset-password')
})

test('usa o fallback quando o valor é null', () => {
  assert.equal(sanitizeNextPath(null), '/dashboard')
})

test('rejeita URL protocol-relative (//host)', () => {
  assert.equal(sanitizeNextPath('//evil.com'), '/dashboard')
})

test('rejeita URL absoluta', () => {
  assert.equal(sanitizeNextPath('https://evil.com'), '/dashboard')
})

test('respeita um fallback customizado', () => {
  assert.equal(sanitizeNextPath(undefined, '/login'), '/login')
})
