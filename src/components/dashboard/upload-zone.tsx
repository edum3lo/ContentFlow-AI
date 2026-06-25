'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UploadZone({
  onUpload
}: {
  onUpload: (file: File) => Promise<void>
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setIsUploading(true)
      await onUpload(file)
      setIsUploading(false)
    }
  }, [onUpload])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsUploading(true)
      await onUpload(file)
      setIsUploading(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60',
        isUploading && 'pointer-events-none opacity-50'
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,image/png,image/jpeg"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleChange}
        disabled={isUploading}
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        {isUploading ? (
          <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
        ) : (
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </span>
        )}
        <p className="mb-1 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Clique para enviar</span> ou arraste o arquivo aqui
        </p>
        <p className="text-xs text-muted-foreground">PDF, PNG ou JPG</p>
      </div>
    </div>
  )
}
