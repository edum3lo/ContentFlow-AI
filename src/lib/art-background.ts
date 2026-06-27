import type { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Modelo oficial da OpenAI para imagens (dall-e-2 é mais barato e acessível no Tier base)
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-2'

/**
 * Retorna um fundo de arte gerado por IA, como data URL, seguindo a cor da marca.
 * Cacheia no Storage por (usuário, formato, cor) — então gera UMA vez e reusa em
 * todos os posts, mantendo o custo baixo. Se algo falhar, retorna null e a arte
 * cai no template normal (fallback seguro).
 */
export async function getOrCreateAiBackground(opts: {
  supabase: SupabaseClient
  userId: string
  isStory: boolean
  brandColor: string | null
}): Promise<string | null> {
  const { supabase, userId, isStory, brandColor } = opts
  const colorKey = (brandColor || 'default').replace('#', '').toLowerCase()
  const path = `${userId}/art-bg/${isStory ? 'story' : 'feed'}-${colorKey}.png`

  // 1. Cache no Storage (reuso)
  const { data: cached } = await supabase.storage.from('products').download(path)
  if (cached) {
    const buf = Buffer.from(await cached.arrayBuffer())
    return `data:image/png;base64,${buf.toString('base64')}`
  }

  // 2. Gera via OpenAI
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const prompt = `Abstract premium background for a social media marketing post. Dominant brand color ${
      brandColor || '#d4af37'
    }. Soft gradients, elegant subtle geometric light shapes, sophisticated studio lighting, generous clean empty negative space to overlay text later. Absolutely no text, no letters, no numbers, no logos, no products, no people. Modern, high-end, professional marketing aesthetic.`

    const resp = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt,
      // DALL-E 2 suporta apenas tamanhos quadrados estritos, o máximo é 1024x1024
      size: '1024x1024',
      response_format: 'b64_json',
      n: 1,
    })

    const b64 = resp.data?.[0]?.b64_json
    if (!b64) return null

    const buffer = Buffer.from(b64, 'base64')

    // 3. Salva no cache para os próximos posts reusarem
    await supabase.storage.from('products').upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

    return `data:image/png;base64,${b64}`
  } catch (e) {
    console.error('Falha ao gerar fundo IA:', e)
    return null
  }
}
