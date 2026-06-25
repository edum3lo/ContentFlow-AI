/**
 * Garante que um destino de redirecionamento é um caminho interno seguro.
 *
 * Aceita apenas caminhos que começam com "/" e não com "//" (que seria
 * interpretado como URL protocol-relative para outro host). Qualquer valor
 * inválido cai no `fallback`. Usado no callback de auth para evitar open redirect.
 */
export function sanitizeNextPath(
  raw: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!raw) return fallback
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback
}
