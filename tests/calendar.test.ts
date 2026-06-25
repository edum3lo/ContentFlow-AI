import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCalendarPlan, CALENDAR_THEMES } from '../src/lib/calendar'

test('gera a quantidade de dias pedida', () => {
  const plan = buildCalendarPlan(30, ['12:00'], new Date(2026, 0, 1))
  assert.equal(plan.length, 30)
})

test('alterna os temas de forma cíclica', () => {
  const plan = buildCalendarPlan(
    CALENDAR_THEMES.length + 1,
    ['12:00'],
    new Date(2026, 0, 1)
  )
  assert.equal(plan[0].themeIndex, 0)
  // depois de um ciclo completo, volta ao primeiro tema
  assert.equal(plan[CALENDAR_THEMES.length].themeIndex, 0)
})

test('datas e horários seguem em sequência a partir do início', () => {
  const plan = buildCalendarPlan(3, ['12:00', '18:00'], new Date(2026, 0, 1))
  assert.equal(plan[0].date.getDate(), 1)
  assert.equal(plan[1].date.getDate(), 2)
  assert.equal(plan[2].date.getDate(), 3)
  // horários alternam ciclicamente
  assert.equal(plan[0].time, '12:00')
  assert.equal(plan[1].time, '18:00')
  assert.equal(plan[2].time, '12:00')
})
