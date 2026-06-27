import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateAiBackground } from '@/lib/art-background'

// Geração do fundo por IA (template "ia") pode passar dos ~10s padrão.
export const maxDuration = 60

// Cache da arte renderizada no navegador do próprio usuário (private, não no
// CDN compartilhado, pois a rota é autenticada). Evita re-renderizar a MESMA
// arte (mesmo template/formato) a cada toggle na galeria ou na exportação —
// só a 1ª geração de cada variante custa um render no Vercel.
// Cache curto: evita re-render repetido na mesma sessão (galeria/export), mas
// deixa marca/foto recém-configuradas aparecerem rápido (até ~1 min).
const ART_CACHE_CONTROL = 'private, max-age=60'

type TemplateKey = 'premium' | 'minimalista' | 'moderno' | 'corporativo'

const TEMPLATES: Record<
  TemplateKey,
  {
    bg: string
    fg: string
    sub: string
    accent: string
    accentFg: string
    badgeBg: string
    glow: string
  }
> = {
  premium: {
    bg: '#0b0b0b',
    fg: '#ffffff',
    sub: '#c7c7c7',
    accent: '#d4af37',
    accentFg: '#0b0b0b',
    badgeBg: 'rgba(212,175,55,0.16)',
    glow: 'radial-gradient(closest-side, rgba(212,175,55,0.25), transparent)',
  },
  minimalista: {
    bg: '#ffffff',
    fg: '#0f172a',
    sub: '#475569',
    accent: '#2563eb',
    accentFg: '#ffffff',
    badgeBg: 'rgba(37,99,235,0.10)',
    glow: 'radial-gradient(closest-side, rgba(37,99,235,0.12), transparent)',
  },
  moderno: {
    bg: '#0a0a12',
    fg: '#f5f5ff',
    sub: '#a5b4fc',
    accent: '#22d3ee',
    accentFg: '#06121a',
    badgeBg: 'rgba(34,211,238,0.14)',
    glow: 'radial-gradient(closest-side, rgba(168,85,247,0.35), transparent)',
  },
  corporativo: {
    bg: '#13315c',
    fg: '#ffffff',
    sub: '#cdd9ec',
    accent: '#5b8def',
    accentFg: '#0a1c33',
    badgeBg: 'rgba(255,255,255,0.14)',
    glow: 'radial-gradient(closest-side, rgba(91,141,239,0.30), transparent)',
  },
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    price
  )

/** Preto ou branco, conforme o que tiver melhor contraste sobre a cor dada. */
function contrastColor(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.substring(0, 2), 16)
  const g = parseInt(m.substring(2, 4), 16)
  const b = parseInt(m.substring(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0b0b0b' : '#ffffff'
}

// Fonte profissional (Poppins) carregada uma vez por instância. Se a busca
// falhar, a arte renderiza com a fonte padrão (fallback seguro).
type FontDef = {
  name: string
  data: ArrayBuffer
  weight: 400 | 600 | 700 | 800
  style: 'normal'
}
let fontsPromise: Promise<FontDef[]> | null = null
function loadFonts(): Promise<FontDef[]> {
  if (fontsPromise) return fontsPromise
  const base = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins'
  const files: Array<[string, FontDef['weight']]> = [
    ['Poppins-Regular.ttf', 400],
    ['Poppins-SemiBold.ttf', 600],
    ['Poppins-Bold.ttf', 700],
    ['Poppins-ExtraBold.ttf', 800],
  ]
  fontsPromise = Promise.all(
    files.map(async ([file, weight]) => {
      const r = await fetch(`${base}/${file}`)
      if (!r.ok) throw new Error('font fetch failed')
      const data = await r.arrayBuffer()
      return { name: 'Poppins', data, weight, style: 'normal' as const }
    })
  ).catch(() => {
    fontsPromise = null // permite tentar de novo no próximo request
    return [] as FontDef[]
  })
  return fontsPromise
}

/** Hash simples e estável de string (pra escolher o layout por conteúdo). */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)

  const templateParam = searchParams.get('template') ?? 'moderno'
  const isAi = templateParam === 'ia'
  const templateKey = templateParam as TemplateKey
  // No modo IA, usa o "moderno" como base de cores do texto.
  const t = TEMPLATES[templateKey] ?? TEMPLATES.moderno
  const isStory = searchParams.get('format') === 'story'

  const width = 1080
  const height = isStory ? 1920 : 1080

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Não autorizado', { status: 401 })
  }

  // Não filtramos por user_id aqui de propósito: o RLS (policy
  // "Users can view own contents") já garante que só o dono enxerga o registro.
  // Conteúdo de outro usuário volta como null e cai no 404 abaixo.
  const { data: content } = await supabase
    .from('generated_contents')
    .select('id, title, cta, type, product_id')
    .eq('id', id)
    .single()

  if (!content) {
    return new Response('Conteúdo não encontrado', { status: 404 })
  }

  // Descobre o produto principal (direto ou via carrossel)
  type ArtProduct = { name: string; price: number; image_url: string | null }
  let product: ArtProduct | null = null
  if (content.product_id) {
    const { data } = await supabase
      .from('products')
      .select('name, price, image_url')
      .eq('id', content.product_id)
      .single()
    product = data
  } else {
    const { data } = await supabase
      .from('content_products')
      .select('products(name, price, image_url)')
      .eq('content_id', content.id)
      .limit(1)
      .single()
    // products pode vir como objeto único
    const p = (data?.products ?? null) as unknown as
      | ArtProduct
      | ArtProduct[]
      | null
    product = Array.isArray(p) ? p[0] ?? null : p
  }

  // Baixa uma imagem como data URL (foto do produto ou logo). Se falhar, volta
  // null e a arte sai sem ela em vez de quebrar — fallback seguro.
  async function toDataUrl(url: string): Promise<string | null> {
    try {
      const r = await fetch(url)
      if (!r.ok) return null
      const ct = r.headers.get('content-type') || 'image/jpeg'
      const buf = Buffer.from(await r.arrayBuffer())
      return `data:${ct};base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  }

  const productImage = product?.image_url
    ? await toDataUrl(product.image_url)
    : null

  // Marca do usuário (nome + logo) — entra no lugar de "ContentFlow AI".
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url, brand_color')
    .eq('id', user.id)
    .single()
  const brandName = profile?.brand_name?.trim() || null
  const brandLogo = profile?.brand_logo_url
    ? await toDataUrl(profile.brand_logo_url)
    : null

  // A cor da marca (extraída do logo) vira o DESTAQUE da arte — assim cada post
  // segue a identidade visual. O resto do template (fundo/texto) é mantido.
  const brandColor =
    typeof profile?.brand_color === 'string' ? profile.brand_color : null
  const accent = brandColor || t.accent
  const accentFg = brandColor ? contrastColor(brandColor) : t.accentFg

  // Fase 2: fundo gerado por IA (na cor da marca), cacheado por marca/formato.
  const aiBackground = isAi
    ? await getOrCreateAiBackground({
        supabase,
        userId: user.id,
        isStory,
        brandColor,
      })
    : null

  // Sobre o fundo de IA o texto vai branco (há um escurecedor por cima da imagem).
  const fg = aiBackground ? '#ffffff' : t.fg
  const sub = aiBackground ? 'rgba(255,255,255,0.82)' : t.sub

  const titleSize = isStory ? 80 : 66
  const padding = isStory ? 96 : 80
  const innerWidth = width - padding * 2
  const imageHeight = isStory ? 760 : 420
  const photoSize = isStory ? 660 : 480

  const fonts = await loadFonts()
  const fontFamily = fonts.length ? 'Poppins' : 'sans-serif'
  // Varia o layout por conteúdo (estável): nem todos os posts ficam iguais.
  // No modo IA mantemos o layout centralizado (combina melhor com o fundo).
  const layout = isAi ? 1 : hashStr(content.id) % 2

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding,
          background: t.bg,
          color: fg,
          position: 'relative',
          fontFamily,
        }}
      >
        {aiBackground ? (
          <>
            {/* Fundo gerado por IA */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aiBackground}
              width={width}
              height={height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width,
                height,
                objectFit: 'cover',
              }}
              alt=""
            />
            {/* Escurecedor para legibilidade do texto */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width,
                height,
                display: 'flex',
                backgroundImage:
                  'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.78))',
              }}
            />
          </>
        ) : (
          <>
            {/* Brilhos decorativos */}
            <div
              style={{
                position: 'absolute',
                top: -220,
                right: -220,
                width: 760,
                height: 760,
                display: 'flex',
                backgroundImage: t.glow,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -260,
                left: -240,
                width: 640,
                height: 640,
                display: 'flex',
                backgroundImage: t.glow,
                opacity: 0.45,
              }}
            />
          </>
        )}

        {layout === 1 ? (
          <>
            {/* Layout B (centralizado) — marca no topo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogo}
                  height={isStory ? 76 : 64}
                  style={{
                    height: isStory ? 76 : 64,
                    maxWidth: 360,
                    objectFit: 'contain',
                  }}
                  alt=""
                />
              ) : brandName ? (
                <div
                  style={{
                    display: 'flex',
                    fontSize: isStory ? 36 : 32,
                    fontWeight: 700,
                  }}
                >
                  {brandName}
                </div>
              ) : (
                <div style={{ display: 'flex' }} />
              )}
            </div>

            {/* Centro centralizado */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {productImage && (
                <div
                  style={{
                    display: 'flex',
                    width: photoSize,
                    height: photoSize,
                    marginBottom: 44,
                    borderRadius: 40,
                    overflow: 'hidden',
                    border: `1px solid ${t.badgeBg}`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImage}
                    width={photoSize}
                    height={photoSize}
                    style={{
                      width: photoSize,
                      height: photoSize,
                      objectFit: 'cover',
                    }}
                    alt=""
                  />
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  textAlign: 'center',
                  fontSize: titleSize,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: -1.5,
                  maxWidth: '92%',
                }}
              >
                {content.title}
              </div>
              {product && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: 34,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 38,
                      fontWeight: 600,
                      textAlign: 'center',
                      maxWidth: '90%',
                      color: fg,
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      marginTop: 22,
                      padding: '16px 40px',
                      borderRadius: 999,
                      background: accent,
                      color: accentFg,
                      fontSize: 52,
                      fontWeight: 800,
                    }}
                  >
                    {formatPrice(Number(product.price))}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé: CTA centralizado */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  padding: '24px 48px',
                  borderRadius: 999,
                  border: `3px solid ${accent}`,
                  color: fg,
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {content.cta || 'Chame no WhatsApp'}
              </div>
            </div>
          </>
        ) : (
          <>
        {/* Topo: marca + selo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {brandLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandLogo}
                height={isStory ? 72 : 60}
                style={{
                  height: isStory ? 72 : 60,
                  maxWidth: 300,
                  objectFit: 'contain',
                }}
                alt=""
              />
            )}
            {brandName && (
              <div
                style={{
                  display: 'flex',
                  fontSize: isStory ? 34 : 30,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                }}
              >
                {brandName}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              padding: '12px 24px',
              borderRadius: 999,
              background: t.badgeBg,
              color: accent,
              fontSize: 24,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Destaque
          </div>
        </div>

        {/* Centro: foto + título + produto */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {productImage && (
            <div
              style={{
                display: 'flex',
                width: innerWidth,
                height: imageHeight,
                marginBottom: 44,
                borderRadius: 36,
                overflow: 'hidden',
                border: `1px solid ${t.badgeBg}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImage}
                width={innerWidth}
                height={imageHeight}
                style={{
                  width: innerWidth,
                  height: imageHeight,
                  objectFit: 'cover',
                }}
                alt=""
              />
            </div>
          )}
          <div
            style={{
              display: 'flex',
              width: 120,
              height: 8,
              borderRadius: 999,
              background: accent,
              marginBottom: 40,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1,
              maxWidth: '95%',
            }}
          >
            {content.title}
          </div>

          {product && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 56,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 44,
                  fontWeight: 600,
                  color: fg,
                }}
              >
                {product.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: 16,
                }}
              >
                <span
                  style={{ display: 'flex', fontSize: 24, color: sub, letterSpacing: 1 }}
                >
                  a partir de
                </span>
                <span
                  style={{
                    display: 'flex',
                    fontSize: 66,
                    fontWeight: 700,
                    color: accent,
                    lineHeight: 1,
                  }}
                >
                  {formatPrice(Number(product.price))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé: CTA + marca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '24px 44px',
              borderRadius: 999,
              background: accent,
              color: accentFg,
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            {content.cta || 'Chame no WhatsApp'}
          </div>
          {brandName && (
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                fontWeight: 600,
                color: sub,
              }}
            >
              {brandName}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    ),
    { width, height, fonts, headers: { 'Cache-Control': ART_CACHE_CONTROL } }
  )
}
