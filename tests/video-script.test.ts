import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildVideoScript } from '../src/lib/video-script'

test('retorna null quando não há slides', () => {
  assert.equal(buildVideoScript(null), null)
  assert.equal(buildVideoScript([]), null)
})

test('monta um slide com o kind em maiúsculas', () => {
  assert.equal(
    buildVideoScript([{ kind: 'gancho', text: 'Olha isso' }]),
    'GANCHO:\nOlha isso'
  )
})

test('junta múltiplos slides com linha em branco', () => {
  assert.equal(
    buildVideoScript([
      { kind: 'gancho', text: 'A' },
      { kind: 'roteiro', text: 'B' },
    ]),
    'GANCHO:\nA\n\nROTEIRO:\nB'
  )
})
