import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'
import { validateUpload } from '@/lib/upload-validation'

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

    const formData = await request.formData()
    const file = formData.get('file') as File

    // Validação server-side de tipo e tamanho (ver validateUpload)
    const validation = validateUpload(file)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 1. Upload para o Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const fileType = file.type

    const { error: uploadError } = await supabase.storage
      .from('catalogs')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Erro de upload:', uploadError)
      return NextResponse.json({ error: 'Falha ao salvar arquivo no Storage' }, { status: 500 })
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('catalogs')
      .getPublicUrl(fileName)

    const fileUrl = publicUrlData.publicUrl

    // 2. Inserir na tabela catalogs
    const { data: catalog, error: dbError } = await supabase
      .from('catalogs')
      .insert({
        user_id: user.id,
        file_url: fileUrl,
        original_filename: file.name,
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
      const buffer = Buffer.from(await file.arrayBuffer())
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
          source_type: fileType.includes('pdf') ? 'pdf' : 'image',
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
