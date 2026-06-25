export type ScriptSlide = { kind?: string; text?: string }

/**
 * Monta o roteiro de vídeo em texto corrido a partir dos slides gerados pela IA
 * (gancho, roteiro, texto de tela). Retorna null se não houver slides válidos.
 *
 * Ex.: { kind: 'gancho', text: 'Olha isso' } -> "GANCHO:\nOlha isso"
 */
export function buildVideoScript(slides: unknown): string | null {
  if (!Array.isArray(slides) || slides.length === 0) return null
  return (slides as ScriptSlide[])
    .map((s) => `${s.kind ? s.kind.toUpperCase() + ':\n' : ''}${s.text ?? ''}`)
    .join('\n\n')
}
