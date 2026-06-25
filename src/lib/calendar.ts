/**
 * Lógica pura do calendário de conteúdo (sem React/ícones), para ser testável.
 * O componente associa os ícones por `key`.
 */

export type Platform = 'instagram' | 'tiktok'

export const CONTENT_DURATIONS = [7, 15, 30, 60] as const

/** Melhores horários por rede (heurística de mercado). */
export const PLATFORM_TIMES: Record<Platform, string[]> = {
  instagram: ['12:00', '18:00', '20:00'],
  tiktok: ['11:00', '19:00', '21:00'],
}

/** Temas que se alternam ao longo do plano. */
export const CALENDAR_THEMES = [
  { key: 'produto', label: 'Produto em destaque', format: 'Post' },
  { key: 'promocao', label: 'Promoção / Oferta', format: 'Story' },
  { key: 'beneficios', label: 'Benefícios', format: 'Carrossel' },
  { key: 'comparacao', label: 'Comparação', format: 'Post' },
  { key: 'curiosidade', label: 'Curiosidade', format: 'Vídeo' },
  { key: 'depoimento', label: 'Depoimento', format: 'Story' },
] as const

export type CalendarEntry = {
  date: Date
  themeIndex: number
  time: string
}

/**
 * Gera o plano dia a dia: para cada dia alterna o tema e o horário sugerido,
 * de forma cíclica. `start` é normalizado para o início do dia.
 */
export function buildCalendarPlan(
  duration: number,
  times: string[],
  start: Date = new Date()
): CalendarEntry[] {
  const base = new Date(start)
  base.setHours(0, 0, 0, 0)

  return Array.from({ length: duration }).map((_, i) => {
    const date = new Date(base)
    date.setDate(base.getDate() + i)
    return {
      date,
      themeIndex: i % CALENDAR_THEMES.length,
      time: times[i % times.length],
    }
  })
}
