import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

// Cache da arte renderizada no navegador do próprio usuário (private, não no
// CDN compartilhado, pois a rota é autenticada). Evita re-renderizar a MESMA
// arte (mesmo template/formato) a cada toggle na galeria ou na exportação —
// só a 1ª geração de cada variante custa um render no Vercel.
const ART_CACHE_CONTROL = 'private, max-age=86400'

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)

  const templateKey = (searchParams.get('template') ?? 'moderno') as TemplateKey
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

  // Carrega a foto do produto como data URL. Se falhar (rede/404), a arte sai
  // sem foto em vez de quebrar — fallback seguro.
  let productImage: string | null = null
  if (product?.image_url) {
    try {
      const r = await fetch(product.image_url)
      if (r.ok) {
        const ct = r.headers.get('content-type') || 'image/jpeg'
        const buf = Buffer.from(await r.arrayBuffer())
        productImage = `data:${ct};base64,${buf.toString('base64')}`
      }
    } catch {
      /* ignora: arte sem foto */
    }
  }

  const titleSize = isStory ? 80 : 68
  const padding = isStory ? 96 : 80
  const innerWidth = width - padding * 2
  const imageHeight = isStory ? 720 : 380

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
          color: t.fg,
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brilho decorativo */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 700,
            height: 700,
            display: 'flex',
            backgroundImage: t.glow,
          }}
        />

        {/* Topo: marca + selo */}
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
              alignItems: 'center',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            ContentFlow
            <span style={{ color: t.accent, marginLeft: 8 }}>AI</span>
          </div>
          <div
            style={{
              display: 'flex',
              padding: '12px 24px',
              borderRadius: 999,
              background: t.badgeBg,
              color: t.accent,
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
                marginBottom: 48,
                borderRadius: 32,
                overflow: 'hidden',
                border: `3px solid ${t.accent}`,
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
              background: t.accent,
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
                  color: t.fg,
                }}
              >
                {product.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  marginTop: 12,
                  color: t.sub,
                  fontSize: 32,
                }}
              >
                a partir de
                <span
                  style={{
                    color: t.accent,
                    fontSize: 56,
                    fontWeight: 700,
                    marginLeft: 16,
                  }}
                >
                  {formatPrice(Number(product.price))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé: CTA */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              padding: '24px 44px',
              borderRadius: 999,
              background: t.accent,
              color: t.accentFg,
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            {content.cta || 'Chame no WhatsApp'}
          </div>
        </div>
      </div>
    ),
    { width, height, headers: { 'Cache-Control': ART_CACHE_CONTROL } }
  )
}
