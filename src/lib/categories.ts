// Pilares de conteúdo (categorias). Compartilhado entre geração, cards e filtros.

export const CONTENT_CATEGORIES = [
  { value: 'vendas', label: 'Vendas', emoji: '💰' },
  { value: 'promocao', label: 'Promoção', emoji: '🔥' },
  { value: 'educacional', label: 'Educacional', emoji: '📚' },
  { value: 'beneficios', label: 'Benefícios', emoji: '✨' },
  { value: 'prova_social', label: 'Prova social', emoji: '🛡️' },
  { value: 'novidade', label: 'Novidade', emoji: '🆕' },
] as const

export type CategoryValue = (typeof CONTENT_CATEGORIES)[number]['value']

/** Rótulo com emoji pra exibir em badges/filtros. */
export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CONTENT_CATEGORIES.map((c) => [c.value, `${c.emoji} ${c.label}`])
)

/** Ordem usada no "Plano automático" (mix equilibrado). */
export const CATEGORY_ROTATION: CategoryValue[] = [
  'educacional',
  'beneficios',
  'vendas',
  'prova_social',
  'promocao',
  'novidade',
]

const GUIDE: Record<string, string> = {
  vendas:
    'Categoria VENDAS: foco em converter agora. CTA forte e direto, senso de oportunidade, destaque do produto e do preço.',
  promocao:
    'Categoria PROMOÇÃO: crie urgência e escassez (oferta por tempo limitado, últimas unidades). Destaque a vantagem da oferta.',
  educacional:
    'Categoria EDUCACIONAL: ensine algo sobre o produto ou o uso, de forma informativa, sem prometer resultados. Gera autoridade; CTA leve.',
  beneficios:
    'Categoria BENEFÍCIOS: destaque, de forma concreta, o que o produto entrega no dia a dia. Menos venda dura, mais valor percebido.',
  prova_social:
    'Categoria PROVA SOCIAL / CONFIANÇA: reforce procedência, qualidade, segurança e credibilidade. Transmita confiança.',
  novidade:
    'Categoria NOVIDADE: anuncie como lançamento/novidade, gere curiosidade e expectativa.',
}

/** Instrução extra pro prompt conforme a categoria. Vazio se inválida. */
export function categoryGuidance(category?: string | null): string {
  if (!category || !GUIDE[category]) return ''
  return `\n\n${GUIDE[category]}`
}

export function isValidCategory(category?: string | null): boolean {
  return !!category && category in GUIDE
}
