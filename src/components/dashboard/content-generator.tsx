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
  Settings2,
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
  { value: 'video', label: 'Vídeo', desc: 'Roteiro p/ gravar', icon: Video },
]

const TONES = [
  { value: '', label: 'Neutro / Padrão' },
  { value: 'Profissional e Autoridade', label: 'Profissional' },
  { value: 'Descontraído e Engraçado', label: 'Descontraído' },
  { value: 'Agressivo (Foco em Vendas Urgentes)', label: 'Vendas' },
  { value: 'Educativo e Informativo', label: 'Educativo' }
]

const NETWORKS = [
  { value: '', label: 'Qualquer (Genérico)' },
  { value: 'Instagram Feed', label: 'Insta Feed' },
  { value: 'TikTok / Instagram Reels', label: 'TikTok/Reels' },
  { value: 'Instagram Stories', label: 'Stories' },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    price
  )

export function ContentGenerator({ products }: { products: Product[] }) {
  const router = useRouter()
  const [type, setType] = useState<ContentType>('post')
  const [selected, setSelected] = useState<string[]>([])
  
  // Configurações avançadas
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [tone, setTone] = useState('')
  const [network, setNetwork] = useState('')
  const [generateScript, setGenerateScript] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  // Carrossel combina vários produtos em UM conteúdo.
  // Os demais tipos geram UM conteúdo POR produto (lote).
  const isCarousel = type === 'carousel'
  const allSelected = products.length > 0 && selected.length === products.length

  const toggleProduct = (id: string) => {
    setError(null)
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    setError(null)
    setSelected(allSelected ? [] : products.map((p) => p.id))
  }

  const changeType = (next: ContentType) => {
    setType(next)
    setError(null)
    // Se mudou para vídeo, desmarca a flag de gerar script junto
    if (next === 'video') setGenerateScript(false)
  }

  const generateOne = async (productIds: string[]) => {
    const res = await fetch('/api/contents/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        productIds,
        instruction: instruction.trim() || undefined,
        tone: tone || undefined,
        network: network || undefined,
        generateScript,
        // O backend gera TODAS as variações numa única chamada.
        variations: quantity,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar conteúdo')
    }
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
      if (isCarousel) {
        // Carrossel: uma única chamada que já gera todas as variações.
        await generateOne(selected)
      } else {
        // Lote: uma chamada por produto — cada uma já devolve todas as variações.
        let failures = 0
        setProgress({ done: 0, total: selected.length })
        for (let p = 0; p < selected.length; p++) {
          try {
            await generateOne([selected[p]])
          } catch {
            failures++
          }
          setProgress({ done: p + 1, total: selected.length })
        }
        if (failures > 0) {
          setError(
            `${selected.length - failures} de ${selected.length} produtos gerados. ${failures} falharam.`
          )
        }
      }

      setSelected([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar conteúdo')
    } finally {
      setLoading(false)
      setProgress(null)
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
      {/* 1. Tipo de conteúdo */}
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

      {/* 2. Seleção de produtos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">
            2.{' '}
            {isCarousel
              ? 'Produtos do carrossel (2 ou mais)'
              : 'Produtos (gera 1 lote para cada)'}
          </p>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            {allSelected ? 'Limpar' : 'Selecionar todos'}
          </button>
        </div>
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

      {/* Configurações Avançadas */}
      <div className="rounded-lg border border-border bg-muted/20">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configurações Avançadas
          </span>
          <span className="text-xs text-muted-foreground">
            {showAdvanced ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showAdvanced && (
          <div className="p-4 pt-0 space-y-4 border-t border-border mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              {/* Quantidade */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Variações por produto</label>
                <select 
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none"
                >
                  <option value={1}>1 Post diferente</option>
                  <option value={2}>2 Posts diferentes</option>
                  <option value={3}>3 Posts diferentes</option>
                  <option value={4}>4 Posts diferentes</option>
                  <option value={5}>5 Posts diferentes</option>
                </select>
              </div>

              {/* Rede Foco */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Rede Social Principal</label>
                <select 
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none"
                >
                  {NETWORKS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>

              {/* Tom de Voz */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Tom de Voz</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs border transition-colors font-medium",
                        tone === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roteiro */}
              {type !== 'video' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={generateScript}
                      onChange={(e) => setGenerateScript(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm font-medium">Gerar roteiro de vídeo (Reels/TikTok) junto com a legenda</span>
                  </label>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">
                Instrução Extra <span className="font-normal text-muted-foreground">(opcional)</span>
              </p>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Ex: foco em promoção de fim de mês, inclua cupom NATAL20..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {selected.length > 0 && (
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            {isCarousel
              ? `1 carrossel × ${quantity} ${quantity === 1 ? 'versão' : 'variações'} = ${quantity} ${quantity === 1 ? 'conteúdo' : 'conteúdos'} no total.`
              : `${selected.length} ${selected.length === 1 ? 'produto' : 'produtos'} × ${quantity} ${quantity === 1 ? 'versão' : 'variações'} = ${selected.length * quantity} ${selected.length * quantity === 1 ? 'conteúdo' : 'conteúdos'} no total.`}
          </p>
          {quantity > 1 && (
            <p className="text-primary/80 font-medium">
              ⚡ As {quantity} variações{isCarousel ? '' : ' de cada produto'} saem numa única geração.
            </p>
          )}
        </div>
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
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {progress
              ? `Gerando ${progress.done}/${progress.total}...`
              : 'Gerando conteúdo...'}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Conteúdo
          </>
        )}
      </Button>
    </div>
  )
}
