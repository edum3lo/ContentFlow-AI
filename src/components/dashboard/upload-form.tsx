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
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar arquivo')
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
