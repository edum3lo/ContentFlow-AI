/** Tipos de arquivo aceitos no upload de catálogos. */
export const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const

/** Tamanho máximo do arquivo de catálogo (10 MB). */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

export type UploadValidation = { ok: true } | { ok: false; error: string }

/**
 * Valida tipo e tamanho do arquivo enviado, no servidor.
 *
 * Não dependemos do `accept` do <input>, que é apenas client-side e burlável.
 */
export function validateUpload(
  file: { type: string; size: number } | null | undefined
): UploadValidation {
  if (!file) {
    return { ok: false, error: 'Nenhum arquivo enviado' }
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
    return {
      ok: false,
      error: 'Tipo de arquivo não suportado. Envie PDF, PNG ou JPG.',
    }
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return { ok: false, error: 'Arquivo muito grande. O limite é 10 MB.' }
  }
  return { ok: true }
}
