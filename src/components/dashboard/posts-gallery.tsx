'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
  Download,
  Trash2,
  CalendarClock,
  MessageCircle,
  Sparkles,
  X,
  Loader2,
  Settings2,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ContentCard, type GeneratedContent } from './content-card'
import { ContentGenerator } from './content-generator'
import { CATEGORY_LABEL } from '@/lib/categories'
import { deleteContent } from '@/app/dashboard/contents/actions'

type GenProduct = {
  id: string
  name: string
  category: string
  price: number
  status: 'review' | 'approved' | 'rejected'
}

const TYPE_LABEL: Record<string, string> = {
  post: 'Feed',
  catalog: 'Feed',
  story: 'Stories',
  video: 'Reels',
  carousel: 'Carrossel',
}

const FILTERS: { value: string; label: string; types: string[] | null }[] = [
  { value: 'all', label: 'Todos', types: null },
  { value: 'feed', label: 'Feed', types: ['post', 'catalog'] },
  { value: 'stories', label: 'Stories', types: ['story'] },
  { value: 'reels', label: 'Reels', types: ['video'] },
  { value: 'carrossel', label: 'Carrossel', types: ['carousel'] },
]

const isVertical = (type: string) => type === 'story' || type === 'video'
const artUrl = (c: GeneratedContent) =>
  `/api/contents/${c.id}/art?format=${isVertical(c.type) ? 'story' : 'feed'}`

function safeName(c: GeneratedContent) {
  return (c.product?.name || c.title || 'post')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 30)
}

function suggestedDate(i: number) {
  const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : `Dia ${i + 1}`
  return `${label} · 09:00`
}

export function PostsGallery({
  contents,
  products,
  brandName,
}: {
  contents: GeneratedContent[]
  products: GenProduct[]
  brandName: string | null
}) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [downloading, setDownloading] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [detail, setDetail] = useState<GeneratedContent | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.value === filter)
    if (!f || !f.types) return contents
    return contents.filter((c) => f.types!.includes(c.type))
  }, [contents, filter])

  const formatos = useMemo(() => {
    const set = new Set(contents.map((c) => TYPE_LABEL[c.type] ?? 'Feed'))
    return [...set].join(', ')
  }, [contents])

  const downloadOne = async (c: GeneratedContent) => {
    const res = await fetch(artUrl(c))
    if (!res.ok) return
    saveAs(await res.blob(), `${safeName(c)}.png`)
  }

  const downloadAll = async () => {
    if (visible.length === 0) return
    setDownloading(true)
    try {
      const zip = new JSZip()
      for (const c of visible) {
        const r = await fetch(artUrl(c))
        if (r.ok) zip.file(`${safeName(c)}-${c.id.substring(0, 4)}.png`, await r.blob())
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `posts-contentflow-${Date.now()}.zip`)
    } catch {
      alert('Erro ao baixar. Tente com menos posts.')
    } finally {
      setDownloading(false)
    }
  }

  const shareWhatsApp = async () => {
    if (visible.length === 0) return
    setDownloading(true)
    try {
      const isMobile =
        typeof navigator !== 'undefined' &&
        (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
          (navigator.maxTouchPoints > 0 &&
            typeof window !== 'undefined' &&
            window.matchMedia('(pointer: coarse)').matches))
      const files: File[] = []
      for (const c of visible.slice(0, 20)) {
        const r = await fetch(artUrl(c))
        if (r.ok)
          files.push(
            new File([await r.blob()], `${safeName(c)}.png`, { type: 'image/png' })
          )
      }
      if (isMobile && navigator.canShare?.({ files })) {
        await navigator.share({ files, title: 'Posts' }).catch(() => {})
      } else {
        await downloadAll()
        alert('Baixei as artes — é só enviar no WhatsApp.')
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = (c: GeneratedContent) => {
    if (!confirm('Excluir este post?')) return
    setPendingId(c.id)
    startTransition(async () => {
      await deleteContent(c.id)
      setPendingId(null)
      if (detail?.id === c.id) setDetail(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {contents.length} posts gerados com sucesso! 🎉
          </h2>
          <p className="mt-1 text-muted-foreground">
            Seus posts estão prontos para publicar e engajar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowGenerator(true)}>
            <Plus className="h-4 w-4" />
            Novo conteúdo
          </Button>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Settings2 className="h-4 w-4" />
            Editar preferências
          </Link>
          <Button onClick={downloadAll} disabled={downloading || contents.length === 0}>
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Baixar todos
          </Button>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhum post gerado ainda</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Clique em &ldquo;Novo conteúdo&rdquo; e gere posts a partir dos seus
            produtos.
          </p>
          <Button className="mt-4" onClick={() => setShowGenerator(true)}>
            <Plus className="h-4 w-4" />
            Novo conteúdo
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Coluna principal: filtros + grid */}
          <div className="space-y-4 lg:col-span-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    filter === f.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((c, i) => (
                <div
                  key={c.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(c)}
                    className="block w-full"
                  >
                    <div
                      className={cn(
                        'relative w-full bg-muted',
                        isVertical(c.type) ? 'aspect-[9/16]' : 'aspect-[4/5]'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artUrl(c)}
                        alt={c.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center justify-between gap-2 p-2.5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate text-xs font-semibold">
                        {TYPE_LABEL[c.type] ?? 'Feed'}
                        {c.category && (
                          <span className="text-muted-foreground">
                            · {CATEGORY_LABEL[c.category] ?? c.category}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {suggestedDate(i)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => downloadOne(c)}
                        title="Baixar"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={isPending && pendingId === c.id}
                        title="Excluir"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        {isPending && pendingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {visible.length === 0 && (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Nenhum post nesse filtro.
              </p>
            )}
          </div>

          {/* Card lateral: resumo */}
          <aside className="lg:col-span-1">
            <div className="space-y-3 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <p className="text-sm font-semibold">Resumo</p>
              <SummaryRow label="Marca" value={brandName || '—'} />
              <SummaryRow label="Posts" value={String(contents.length)} />
              <SummaryRow label="Formatos" value={formatos || '—'} />
              <SummaryRow
                label="Período"
                value={`${contents.length} ${contents.length === 1 ? 'dia' : 'dias'}`}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Barra inferior: agendar + whatsapp */}
      {contents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium">Agendar todos os posts</p>
                <p className="text-xs text-muted-foreground">
                  Distribua no calendário de conteúdo.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Agendar
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium">Enviar para WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  Compartilhe as artes com sua equipe.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={shareWhatsApp} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enviar
            </Button>
          </div>
        </div>
      )}

      {/* Modal: gerador de conteúdo */}
      {showGenerator && (
        <Modal title="Gerar conteúdo" onClose={() => setShowGenerator(false)}>
          <ContentGenerator products={products} />
        </Modal>
      )}

      {/* Modal: detalhe do post */}
      {detail && (
        <Modal title="Post" onClose={() => setDetail(null)}>
          <ContentCard content={detail} />
        </Modal>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
