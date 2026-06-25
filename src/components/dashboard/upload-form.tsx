'use client'

import { UploadZone } from './upload-zone'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UploadForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/catalogs/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        // A resposta pode não ser JSON (ex.: página de erro do Vercel em
        // timeout/limite). Tratamos sem quebrar com "Unexpected token".
        let message = 'Erro ao enviar arquivo'
        try {
          const data = await res.json()
          message = data.error || message
        } catch {
          message =
            res.status === 413
              ? 'Arquivo grande demais. Tente um arquivo menor.'
              : res.status === 504
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
