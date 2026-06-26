'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateBranding } from '@/app/dashboard/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, Check, Trash2, Image as ImageIcon } from 'lucide-react'

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export function BrandForm({
  initialName,
  initialLogoUrl,
}: {
  initialName: string
  initialLogoUrl: string | null
}) {
  const [name, setName] = useState(initialName)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  // undefined = não mudou; null = remover; string = novo caminho
  const [logoPath, setLogoPath] = useState<string | null | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onPickLogo = async (file: File) => {
    setError(null)
    setMsg(null)
    if (!ALLOWED.includes(file.type)) {
      setError('O logo deve ser PNG, JPG, WEBP ou SVG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo muito grande. O limite é 2 MB.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }
      const ext = file.name.split('.').pop()
      const path = `${user.id}/brand/logo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('products')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) {
        setError('Falha ao enviar o logo. Tente novamente.')
        return
      }
      const { data } = supabase.storage.from('products').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
      setLogoPath(path)
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = () => {
    setLogoUrl(null)
    setLogoPath(null)
    setMsg(null)
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    setError(null)
    const res = await updateBranding({ brandName: name, logoPath })
    if ('error' in res) {
      setError(res.error)
    } else {
      setMsg('Marca salva! Já vale para as próximas artes geradas.')
      setLogoPath(undefined)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      {/* Nome da marca */}
      <div className="space-y-1.5">
        <label htmlFor="brand-name" className="text-sm font-medium">
          Nome da marca
        </label>
        <Input
          id="brand-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Ex: Loja da Ana, Suplementos XYZ..."
        />
        <p className="text-xs text-muted-foreground">
          Aparece nas artes. Deixe em branco para não mostrar nome.
        </p>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Logotipo</p>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {logoUrl ? 'Trocar logo' : 'Enviar logo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onPickLogo(file)
                  e.target.value = ''
                }}
              />
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={removeLogo}
                className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-destructive hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP ou SVG (até 2 MB). PNG com fundo transparente fica
              melhor.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {msg && (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" />
          {msg}
        </p>
      )}

      <Button onClick={save} disabled={saving || uploading} className="font-semibold">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Salvar marca
      </Button>
    </div>
  )
}
