'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { success: true } | { error: string }

/**
 * Salva a marca do usuário (nome + logo). O logo já foi enviado ao Storage
 * pelo navegador; aqui recebemos o caminho, validamos e gravamos a URL pública.
 * - logoPath === undefined → não mexe no logo (só atualiza o nome)
 * - logoPath === null → remove o logo
 * - logoPath string → define o novo logo
 */
export async function updateBranding(values: {
  brandName: string
  logoPath?: string | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const update: { brand_name: string | null; brand_logo_url?: string | null } = {
    brand_name: values.brandName.trim() || null,
  }

  if (values.logoPath !== undefined) {
    if (values.logoPath === null) {
      update.brand_logo_url = null
    } else {
      if (!values.logoPath.startsWith(`${user.id}/`)) {
        return { error: 'Acesso negado à imagem' }
      }
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(values.logoPath)
      update.brand_logo_url = data.publicUrl
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return { error: 'Falha ao salvar a marca' }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
