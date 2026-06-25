import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateUpload, MAX_UPLOAD_SIZE } from '../src/lib/upload-validation'

test('aceita um PDF dentro do limite', () => {
  assert.deepEqual(validateUpload({ type: 'application/pdf', size: 1024 }), {
    ok: true,
  })
})

test('aceita PNG e JPG', () => {
  assert.equal(validateUpload({ type: 'image/png', size: 1024 }).ok, true)
  assert.equal(validateUpload({ type: 'image/jpeg', size: 1024 }).ok, true)
})

test('rejeita quando não há arquivo', () => {
  assert.equal(validateUpload(null).ok, false)
})

test('rejeita tipo não suportado', () => {
  assert.equal(validateUpload({ type: 'application/zip', size: 10 }).ok, false)
})

test('rejeita arquivo acima do limite de tamanho', () => {
  assert.equal(
    validateUpload({ type: 'image/png', size: MAX_UPLOAD_SIZE + 1 }).ok,
    false
  )
})
