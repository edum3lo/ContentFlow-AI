import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildVideoScript } from '@/lib/video-script'

// A geração via OpenAI pode passar dos ~10s padrão do Vercel.
export const maxDuration = 60

// Instanciação preguiçosa: criar o cliente só em runtime evita que o `next build`
// quebre ao importar a rota sem a OPENAI_API_KEY definida.
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Modelo da GERAÇÃO de texto (legenda/hashtags/roteiro): tarefa mais perdoável,
// então o padrão é um modelo barato. Pode ser sobrescrito por env var.
const GENERATION_MODEL = process.env.OPENAI_GENERATION_MODEL || 'gpt-4o-mini'

type ContentType = 'post' | 'story' | 'carousel' | 'video'

const VALID_TYPES: ContentType[] = ['post', 'story', 'carousel', 'video']

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    price
  )

function buildInstructions(type: ContentType) {
  const base = `Você é um especialista em marketing para redes sociais (Instagram, TikTok, Facebook e WhatsApp) focado em pequenos negócios no Brasil.
Escreva sempre em português do Brasil, com tom persuasivo, claro e profissional, usando emojis com moderação.
Nunca invente preços ou características: use exatamente os dados do(s) produto(s) fornecido(s).
Retorne SOMENTE um JSON válido, sem markdown e sem comentários.`

  if (type === 'post') {
    return `${base}

Gere um POST para feed com este formato:
{
  "title": "Gancho curto e chamativo (máx. 8 palavras)",
  "caption": "Legenda completa e otimizada (3 a 5 linhas, com quebras de linha \\n)",
  "hashtags": "entre 10 e 20 hashtags separadas por espaço, todas começando com #",
  "cta": "Chamada para ação curta (ex: Chame no WhatsApp)"
}`
  }

  if (type === 'video') {
    return `${base}

Gere um ROTEIRO DE VÍDEO curto (Reels/TikTok) com este formato:
{
  "title": "Gancho dos primeiros 3 segundos (frase de impacto)",
  "caption": "Ideia geral / descrição curta do vídeo",
  "hashtags": "entre 8 e 15 hashtags separadas por espaço, começando com #",
  "cta": "Chamada para ação no final do vídeo",
  "slides": [
    { "kind": "gancho", "text": "Frase de abertura para os primeiros 3 segundos" },
    { "kind": "roteiro", "text": "Roteiro passo a passo do vídeo, use \\n entre os passos" },
    { "kind": "texto da tela", "text": "Textos curtos para aparecer na tela durante o vídeo, use \\n entre eles" }
  ]
}`
  }

  if (type === 'story') {
    return `${base}

Gere um conjunto de STORIES com este formato:
{
  "title": "Gancho curto para os primeiros segundos",
  "caption": "Texto curto e direto para aparecer na tela do story",
  "hashtags": "entre 8 e 15 hashtags separadas por espaço, começando com #",
  "cta": "Chamada para ação curta",
  "slides": [
    { "kind": "promocional", "text": "Texto do story promocional" },
    { "kind": "urgencia", "text": "Texto do story de urgência/escassez" },
    { "kind": "lancamento", "text": "Texto do story de lançamento/novidade" }
  ]
}`
  }

  // carousel
  return `${base}

Gere um CARROSSEL com slides. O primeiro slide é a capa e o último é o CTA; os slides do meio apresentam um produto cada.
Formato:
{
  "title": "Tema do carrossel (ex: Produtos mais procurados)",
  "caption": "Legenda completa do carrossel (3 a 5 linhas, com \\n)",
  "hashtags": "entre 10 e 20 hashtags separadas por espaço, começando com #",
  "cta": "Chamada para ação curta",
  "slides": [
    { "kind": "capa", "heading": "Título da capa", "body": "Subtítulo da capa" },
    { "kind": "produto", "heading": "Nome do produto", "body": "Texto de venda curto com o preço" },
    { "kind": "cta", "heading": "Chamada final", "body": "Reforço do CTA" }
  ]
}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const type = body?.type as ContentType
    const productIds: string[] = Array.isArray(body?.productIds)
      ? body.productIds
      : []

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de conteúdo inválido' },
        { status: 400 }
      )
    }

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Selecione ao menos um produto' },
        { status: 400 }
      )
    }

    if (type !== 'carousel' && productIds.length > 1) {
      return NextResponse.json(
        { error: 'Post e story usam apenas um produto' },
        { status: 400 }
      )
    }

    // Busca os produtos do usuário (RLS garante que são dele)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, category, brand, dosage, price, description, status')
      .in('id', productIds)
      .eq('status', 'approved')

    if (productsError || !products || products.length === 0) {
      return NextResponse.json(
        { error: 'Produtos não encontrados' },
        { status: 404 }
      )
    }

    const productsText = products
      .map((p, i) => {
        const parts = [
          `Produto ${i + 1}:`,
          `- Nome: ${p.name}`,
          `- Categoria: ${p.category}`,
          p.brand ? `- Marca: ${p.brand}` : null,
          p.dosage ? `- Dosagem/Tamanho: ${p.dosage}` : null,
          `- Preço: ${formatPrice(Number(p.price))}`,
          p.description ? `- Descrição: ${p.description}` : null,
        ].filter(Boolean)
        return parts.join('\n')
      })
      .join('\n\n')

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: GENERATION_MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: buildInstructions(type) },
        {
          role: 'user',
          content: `Gere o conteúdo com base no(s) seguinte(s) produto(s):\n\n${productsText}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'A IA não retornou conteúdo' },
        { status: 502 }
      )
    }

    let parsed: {
      title?: string
      caption?: string
      hashtags?: string
      cta?: string
      slides?: unknown
    }
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'Resposta da IA em formato inválido' },
        { status: 502 }
      )
    }

    const slides = parsed.slides ?? null

    const videoScript = type === 'video' ? buildVideoScript(slides) : null

    const { data: inserted, error: insertError } = await supabase
      .from('generated_contents')
      .insert({
        user_id: user.id,
        product_id: type === 'carousel' ? null : products[0].id,
        type,
        title: parsed.title || 'Conteúdo gerado',
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || '',
        cta: parsed.cta || '',
        video_script: videoScript,
        content_data: slides ? { slides } : null,
      })
      .select()
      .single()

    if (insertError || !inserted) {
      console.error('Erro ao salvar conteúdo:', insertError)
      return NextResponse.json(
        { error: 'Falha ao salvar o conteúdo gerado' },
        { status: 500 }
      )
    }

    // Vincula produtos do carrossel (relação N:N)
    if (type === 'carousel') {
      const links = products.map((p) => ({
        content_id: inserted.id,
        product_id: p.id,
      }))
      const { error: linkError } = await supabase
        .from('content_products')
        .insert(links)
      if (linkError) {
        console.error('Erro ao vincular produtos do carrossel:', linkError)
      }
    }

    return NextResponse.json({ success: true, content: inserted })
  } catch (error) {
    console.error('Erro inesperado ao gerar conteúdo:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao gerar conteúdo' },
      { status: 500 }
    )
  }
}
