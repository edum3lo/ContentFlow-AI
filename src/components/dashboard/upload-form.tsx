'use client'

import { UploadZone } from './upload-zone'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateUpload } from '@/lib/upload-validation'

export function UploadForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setError(null)

    // Validação local (a rota revalida no servidor após baixar do Storage).
    const validation = validateUpload(file)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }

      // 1. Upload direto do navegador para o Storage.
      // O arquivo NÃO passa pela Serverless Function, então não esbarra no
      // limite de ~4,5 MB do corpo da requisição do Vercel. O caminho começa
      // com o id do usuário para casar com as policies do bucket "catalogs".
      const fileExt = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('catalogs')
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        console.error('Erro de upload:', uploadError)
        setError('Falha ao enviar o arquivo. Tente novamente.')
        return
      }

      // 2. Pede para a função processar o arquivo que já está no Storage.
      // O corpo agora é minúsculo (só o caminho + metadados).
      const res = await fetch('/api/catalogs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          originalFilename: file.name,
          fileType: file.type,
        }),
      })

      if (!res.ok) {
        // A resposta pode não ser JSON (ex.: página de erro do Vercel em
        // timeout). Tratamos sem quebrar com "Unexpected token".
        let message = 'Erro ao processar arquivo'
        try {
          const data = await res.json()
          message = data.error || message
        } catch {
          message =
            res.status === 504
              ? 'A análise demorou demais. Tente uma imagem/PDF menor.'
              : `Erro ${res.status} ao processar o arquivo.`
        }
        throw new Error(message)
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo')
    }
  }

  return (
    <div className="space-y-2">
      <UploadZone onUpload={handleUpload} />
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  )
}
