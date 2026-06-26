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

function buildInstructions(type: ContentType, tone?: string, network?: string) {
  let base = `Você é um especialista em marketing de redes sociais para negócios locais no Brasil, com experiência em criar posts, stories e roteiros prontos para publicar.
Escreva sempre em português do Brasil, mantendo o texto direto, moderno e específico para o produto.
Nunca invente preços, características, benefícios ou usos: use exatamente os dados do(s) produto(s) fornecido(s).
Evite frases genéricas como "este produto" ou "nosso produto"; use o nome exato do produto e o preço quando disponíveis.
Se houver um nome de marca do cliente, utilize-o para tornar a mensagem mais identificável.
Retorne SOMENTE um JSON válido, sem markdown e sem comentários.`

  if (tone) {
    base += `\nO TOM DE VOZ DEVE SER: ${tone}. Adapte a linguagem da legenda e do título rigorosamente para esse tom.`
  }
  
  if (network) {
    base += `\nA REDE SOCIAL FOCO É: ${network}. Adapte o tamanho e a estrutura do texto para essa rede (ex: legendas mais curtas e diretas para TikTok, legendas mais ricas para Instagram Feed).`
  }

  if (type === 'post') {
    return `${base}

Gere um POST para feed com este formato:
{
  "title": "Gancho curto e chamativo (máx. 8 palavras)",
  "caption": "Legenda completa e otimizada, 3 a 5 linhas, com quebras de linha \\n. Inclua preço exato e destaque do produto.",
  "hashtags": "entre 8 e 15 hashtags separadas por espaço, todas começando com #",
  "cta": "Chamada para ação curta (ex: Chame no WhatsApp, Clique para comprar)"
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
    { "kind": "promocional", "text": "Texto do story promocional com nome do produto e preço" },
    { "kind": "urgencia", "text": "Texto de urgência/escassez com oferta ou limite" },
    { "kind": "lancamento", "text": "Texto de lançamento/novidade com vantagem clara" }
  ]
}`
  }

  // carousel
  return `${base}

Gere um CARROSSEL com slides. O primeiro slide deve ser a capa, os slides do meio devem apresentar cada produto selecionado e o último slide deve ser o CTA.
Formato:
{
  "title": "Tema do carrossel (ex: Produtos mais procurados)",
  "caption": "Legenda completa do carrossel (3 a 5 linhas, com \\n)",
  "hashtags": "entre 8 e 15 hashtags separadas por espaço, começando com #",
  "cta": "Chamada para ação curta",
  "slides": [
    { "kind": "capa", "heading": "Título da capa", "body": "Subtítulo da capa" },
    { "kind": "produto", "heading": "Nome do produto", "body": "Texto de venda curto com o preço" },
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
      
    const tone = body?.tone as string | undefined
    const network = body?.network as string | undefined
    const generateScript = body?.generateScript === true
    // Número de variações distintas a gerar numa ÚNICA chamada (1 a 5).
    const variations = Math.min(
      Math.max(parseInt(String(body?.variations ?? 1), 10) || 1, 1),
      5
    )

    // Instrução opcional do usuário (prompt). Limitada para evitar abuso/custo.
    const instruction =
      typeof body?.instruction === 'string'
        ? body.instruction.trim().slice(0, 500)
        : ''

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('brand_name')
      .eq('id', user.id)
      .single()
    const brandName = profile?.brand_name?.trim() || null

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

    let finalInstruction = instruction
      ? `\n\nInstrução adicional do usuário: ${instruction}`
      : ''

    if (brandName) {
      finalInstruction += `\n\nA marca/loja se chama "${brandName}". Quando fizer sentido, cite a marca no texto ou no CTA (ex.: "Chame a ${brandName} no WhatsApp"). Não invente outro nome de loja.`
    }

    if (generateScript && type !== 'video') {
      finalInstruction += `\n\nIMPORTANTE: O usuário pediu um roteiro de vídeo junto com esse conteúdo. Adicione um campo 'slides' no JSON contendo pelo menos um objeto { "kind": "roteiro", "text": "Passos para gravar o vídeo..." } e { "kind": "gancho", "text": "..." }.`
    }
    
    if (variations > 1) {
      finalInstruction += `\n\nGere ${variations} VARIAÇÕES bem diferentes entre si — ângulos de venda, ganchos e textos distintos, sem repetir abordagens. Retorne um JSON no formato { "variations": [ ... ] }, onde CADA item do array segue exatamente o formato pedido acima.`
    }

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: GENERATION_MODEL,
      temperature: 0.65,
      messages: [
        { role: 'system', content: buildInstructions(type, tone, network) },
        {
          role: 'user',
          content: `Gere o conteúdo com base no(s) seguinte(s) produto(s):\n\n${productsText}${finalInstruction}`,
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

    // Normaliza para uma lista de itens (1 conteúdo, ou várias variações).
    type GenItem = {
      title?: string
      caption?: string
      hashtags?: string
      cta?: string
      slides?: unknown
    }
    const variationList = (parsed as { variations?: unknown }).variations
    const items: GenItem[] =
      variations > 1 && Array.isArray(variationList)
        ? (variationList as GenItem[])
        : [parsed]

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'A IA não retornou variações' },
        { status: 502 }
      )
    }

    let savedCount = 0
    for (const item of items) {
      const slides = item.slides ?? null
      const videoScript =
        type === 'video' || generateScript ? buildVideoScript(slides) : null

      const { data: inserted, error: insertError } = await supabase
        .from('generated_contents')
        .insert({
          user_id: user.id,
          product_id: type === 'carousel' ? null : products[0].id,
          type,
          title: item.title || 'Conteúdo gerado',
          caption: item.caption || '',
          hashtags: item.hashtags || '',
          cta: item.cta || '',
          video_script: videoScript,
          content_data: slides ? { slides } : null,
        })
        .select()
        .single()

      if (insertError || !inserted) {
        console.error('Erro ao salvar conteúdo:', insertError)
        continue
      }
      savedCount++

      // Vincula produtos do carrossel (relação N:N) para cada variação
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
    }

    if (savedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao salvar o conteúdo gerado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, count: savedCount })
  } catch (error) {
    console.error('Erro inesperado ao gerar conteúdo:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao gerar conteúdo' },
      { status: 500 }
    )
  }
}
