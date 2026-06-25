'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Loader2,
  Square,
  CheckSquare,
  Image as ImageIcon,
  LayoutGrid,
  Clapperboard,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ContentType = 'post' | 'story' | 'carousel' | 'video'

type Product = {
  id: string
  name: string
  category: string
  price: number
  status: 'review' | 'approved' | 'rejected'
}

const TYPES: {
  value: ContentType
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'post', label: 'Post', desc: 'Feed', icon: ImageIcon },
  { value: 'story', label: 'Story', desc: '3 variações', icon: Clapperboard },
  {
    value: 'carousel',
    label: 'Carrossel',
    desc: 'Vários produtos',
    icon: LayoutGrid,
  },
  { value: 'video', label: 'Vídeo', desc: 'Roteiro', icon: Video },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    price
  )

export function ContentGenerator({ products }: { products: Product[] }) {
  const router = useRouter()
  const [type, setType] = useState<ContentType>('post')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCarousel = type === 'carousel'

  const toggleProduct = (id: string) => {
    setError(null)
    if (isCarousel) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      )
    } else {
      setSelected((prev) => (prev[0] === id ? [] : [id]))
    }
  }

  const changeType = (next: ContentType) => {
    setType(next)
    setError(null)
    // Carrossel pode ter vários; ao sair dele, mantém só o primeiro
    setSelected((prev) => (next === 'carousel' ? prev : prev.slice(0, 1)))
  }

  const handleGenerate = async () => {
    setError(null)

    if (selected.length === 0) {
      setError('Selecione ao menos um produto.')
      return
    }
    if (isCarousel && selected.length < 2) {
      setError('Um carrossel precisa de pelo menos 2 produtos.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, productIds: selected }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar conteúdo')
      }

      setSelected([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
        <Sparkles className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhum produto aprovado</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Aprove produtos na aba Produtos para liberá-los para geração de
          conteúdo.
        </p>
        <Link
          href="/dashboard/products"
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Revisar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tipo de conteúdo */}
      <div>
        <p className="mb-2 text-sm font-medium">1. Tipo de conteúdo</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES.map((t) => {
            const active = type === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => changeType(t.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border hover:bg-muted/60'
                )}
              >
                <t.icon
                  className={cn(
                    'h-5 w-5',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Seleção de produtos */}
      <div>
        <p className="mb-2 text-sm font-medium">
          2. {isCarousel ? 'Produtos (2 ou mais)' : 'Produto'}
        </p>
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {products.map((p) => {
            const checked = selected.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/60'
                )}
              >
                {checked ? (
                  <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {p.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {p.category}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {formatPrice(Number(p.price))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando conteúdo...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Gerar conteúdo
          </>
        )}
      </Button>
    </div>
  )
}
