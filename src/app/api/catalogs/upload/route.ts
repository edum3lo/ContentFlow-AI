import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { validateUpload, ALLOWED_UPLOAD_TYPES } from '@/lib/upload-validation'

// A leitura por IA (Vision/OCR) pode passar dos ~10s padrão do Vercel.
// 60s é o máximo no plano Hobby; sem isso a função estoura e retorna HTML.
export const maxDuration = 60

// Instanciação preguiçosa: criar o cliente só em runtime evita que o `next build`
// quebre ao importar a rota sem a OPENAI_API_KEY definida.
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Modelo da EXTRAÇÃO (OCR/Vision): qualidade é crítica aqui, então o padrão é
// um modelo forte. Pode ser sobrescrito por env var.
const EXTRACTION_MODEL = process.env.OPENAI_EXTRACTION_MODEL || 'gpt-4o'

type ExtractedProduct = {
  name?: string
  category?: string
  brand?: string | null
  dosage?: string | null
  price?: number
  extracted_price_text?: string | null
  description?: string | null
  confidence_score?: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // O arquivo já foi enviado direto ao Storage pelo navegador. Aqui chega
    // apenas o caminho (corpo minúsculo), evitando o limite de ~4,5 MB do Vercel.
    const body = await request.json().catch(() => null)
    const path = typeof body?.path === 'string' ? body.path : undefined
    const originalFilename =
      typeof body?.originalFilename === 'string' ? body.originalFilename : undefined
    const fileType = typeof body?.fileType === 'string' ? body.fileType : undefined

    if (!path || !originalFilename || !fileType) {
      return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
    }

    // Segurança: o arquivo precisa estar na pasta do próprio usuário.
    // Impede que alguém peça o processamento de um arquivo de outra pessoa.
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Acesso negado ao arquivo' }, { status: 403 })
    }

    if (!ALLOWED_UPLOAD_TYPES.includes(fileType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Envie PDF, PNG ou JPG.' },
        { status: 400 }
      )
    }

    // 1. Baixa o arquivo do Storage (a policy de leitura da própria pasta cobre isto)
    const { data: blob, error: downloadError } = await supabase.storage
      .from('catalogs')
      .download(path)

    if (downloadError || !blob) {
      console.error('Erro ao baixar do Storage:', downloadError)
      return NextResponse.json({ error: 'Arquivo não encontrado no Storage' }, { status: 404 })
    }

    // Revalida o tamanho real no servidor (não confiamos só no client).
    const validation = validateUpload({ type: fileType, size: blob.size })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // URL pública (bucket é público) para salvar no registro do catálogo.
    const { data: publicUrlData } = supabase.storage
      .from('catalogs')
      .getPublicUrl(path)

    const fileUrl = publicUrlData.publicUrl

    // 2. Inserir na tabela catalogs
    const { data: catalog, error: dbError } = await supabase
      .from('catalogs')
      .insert({
        user_id: user.id,
        file_url: fileUrl,
        original_filename: originalFilename,
        file_type: fileType,
        status: 'processing',
      })
      .select()
      .single()

    if (dbError || !catalog) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Falha ao registrar catálogo no banco' }, { status: 500 })
    }

    // 3. Processar com OpenAI
    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      const openai = getOpenAI()
      let extractedData: ExtractedProduct[] = []

      const systemPrompt = `Você é um assistente especializado em extrair informações de catálogos e listas de preços.
Retorne um JSON contendo uma array chamada "products".
Cada produto deve ter o seguinte formato:
{
  "name": "Nome do produto",
  "category": "Categoria do produto",
  "price": 100.50 (apenas o número float),
  "extracted_price_text": "R$ 100,50",
  "brand": "Marca (se houver, senão null)",
  "dosage": "Dosagem ou tamanho (se houver, senão null)",
  "description": "Descrição breve se houver",
  "confidence_score": 0.95 (sua confiança na extração de 0 a 1)
}
Retorne SOMENTE o JSON válido, sem markdown.`

      if (fileType === 'application/pdf') {
        // Import dinâmico: só carrega o pdf-parse quando o arquivo é PDF,
        // evitando que ele seja avaliado (e possa quebrar) em uploads de imagem.
        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: buffer })
        const pdfData = await parser.getText()
        const text = pdfData.text
        await parser.destroy()

        const response = await openai.chat.completions.create({
          model: EXTRACTION_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extraia os produtos deste texto de catálogo PDF:\n\n${text}` }
          ],
          response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        if (content) {
          const json = JSON.parse(content)
          extractedData = json.products || []
        }
      } else {
        // Imagem (Vision)
        const base64Image = buffer.toString('base64')
        const dataUrl = `data:${fileType};base64,${base64Image}`

        const response = await openai.chat.completions.create({
          model: EXTRACTION_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extraia os produtos desta imagem de lista de preços.' },
                { type: 'image_url', image_url: { url: dataUrl } }
              ]
            }
          ],
          response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        if (content) {
          const json = JSON.parse(content)
          extractedData = json.products || []
        }
      }

      // 4. Salvar produtos extraídos no banco
      if (extractedData.length > 0) {
        // Foto de produto ÚNICO: se for uma imagem com 1 produto só, a própria
        // imagem enviada vira a foto daquele produto (entra na arte depois).
        const isImage = !fileType.includes('pdf')
        const autoImageUrl =
          isImage && extractedData.length === 1 ? fileUrl : null

        const productsToInsert = extractedData.map(p => ({
          user_id: user.id,
          catalog_id: catalog.id,
          name: p.name || 'Produto sem nome',
          category: p.category || 'Geral',
          brand: p.brand || null,
          dosage: p.dosage || null,
          price: p.price || 0,
          extracted_price_text: p.extracted_price_text || null,
          description: p.description || null,
          confidence_score: p.confidence_score || 1,
          source_type: isImage ? 'image' : 'pdf',
          image_url: autoImageUrl,
          status: 'review'
        }))

        const { error: insertError } = await supabase
          .from('products')
          .insert(productsToInsert)

        if (insertError) {
          console.error('Error inserting products:', insertError)
        }
      }

      // Atualizar status do catálogo
      await supabase
        .from('catalogs')
        .update({ status: 'completed', extraction_result: { total_extracted: extractedData.length } })
        .eq('id', catalog.id)

      return NextResponse.json({ success: true, catalogId: catalog.id, extractedCount: extractedData.length })

    } catch (processError: unknown) {
      console.error('Processing error:', processError)

      const message =
        processError instanceof Error ? processError.message : 'Erro desconhecido'

      // Atualizar status de erro
      await supabase
        .from('catalogs')
        .update({ status: 'error', error_message: message })
        .eq('id', catalog.id)

      return NextResponse.json({ error: 'Falha ao processar arquivo com Inteligência Artificial' }, { status: 500 })
    }

  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erro inesperado no servidor' }, { status: 500 })
  }
}
