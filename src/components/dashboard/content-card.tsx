'use client'

import { useState, useTransition } from 'react'
import {
  Copy,
  Check,
  Trash2,
  Hash,
  Megaphone,
  Loader2,
  Image as ImageIcon,
  LayoutGrid,
  Clapperboard,
  Video,
  Download,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { deleteContent } from '@/app/dashboard/contents/actions'

type Slide = {
  kind?: string
  text?: string
  heading?: string
  body?: string
}

export type GeneratedContent = {
  id: string
  type: 'post' | 'story' | 'carousel' | 'catalog' | 'video'
  title: string
  caption: string
  hashtags: string
  cta: string
  content_data: { slides?: Slide[] } | null
  created_at: string
  product?: { name: string } | null
}

const TYPE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  post: { label: 'Post', icon: ImageIcon },
  story: { label: 'Story', icon: Clapperboard },
  carousel: { label: 'Carrossel', icon: LayoutGrid },
  catalog: { label: 'Catálogo', icon: LayoutGrid },
  video: { label: 'Vídeo', icon: Video },
}

const ART_TEMPLATES = [
  { key: 'moderno', label: 'Moderno' },
  { key: 'premium', label: 'Premium' },
  { key: 'minimalista', label: 'Minimalista' },
  { key: 'corporativo', label: 'Corporativo' },
]

function ArtExport({ contentId }: { contentId: string }) {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState('moderno')
  // Padrão 9:16 (vertical) — formato de TikTok, Reels e Stories.
  const [format, setFormat] = useState<'post' | 'story'>('story')

  const url = `/api/contents/${contentId}/art?template=${template}&format=${format}`

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Gerar arte (imagem)
        </span>
        <span className="text-xs text-muted-foreground">
          {open ? 'Fechar' : 'Abrir'}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="flex flex-wrap gap-1.5">
            {ART_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => setTemplate(tpl.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  template === tpl.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            {(['post', 'story'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  format === f
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'post' ? 'Feed (1:1)' : 'TikTok/Reels (9:16)'}
              </button>
            ))}
          </div>

          <div className="flex justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={url}
              src={url}
              alt="Pré-visualização da arte"
              className={cn(
                'rounded-md',
                format === 'post' ? 'max-h-72' : 'max-h-96'
              )}
            />
          </div>

          <a
            href={url}
            download={`contentflow-${template}-${format}.png`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Baixar PNG
          </a>
        </div>
      )}
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copiado' : label}
    </button>
  )
}

export function ContentCard({ content }: { content: GeneratedContent }) {
  const [isPending, startTransition] = useTransition()
  const meta = TYPE_META[content.type] ?? TYPE_META.post
  const Icon = meta.icon
  const slides = content.content_data?.slides ?? []

  const fullText = [
    content.caption,
    '',
    content.cta,
    '',
    content.hashtags,
  ].join('\n')

  const handleDelete = () => {
    if (!confirm('Excluir este conteúdo?')) return
    startTransition(async () => {
      await deleteContent(content.id)
    })
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <Badge variant="secondary" className="mb-0.5">
                {meta.label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {content.product?.name
                  ? content.product.name + ' • '
                  : ''}
                {new Date(content.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label="Excluir"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Título */}
        <h3 className="text-base font-semibold leading-snug">{content.title}</h3>

        {/* Aviso: vídeo é roteiro, não o arquivo de vídeo pronto */}
        {content.type === 'video' && (
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            🎬 Este é o <span className="font-medium text-foreground">roteiro pronto para você gravar</span> — o vídeo em si você grava seguindo os passos abaixo.
          </p>
        )}

        {/* Slides (story / carrossel) */}
        {slides.length > 0 && (
          <div className="space-y-2">
            {slides.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/40 p-3"
              >
                {s.kind && (
                  <span className="mb-1 inline-block text-[11px] font-medium uppercase tracking-wide text-primary">
                    {s.kind}
                  </span>
                )}
                {s.heading && (
                  <p className="text-sm font-medium">{s.heading}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {s.body ?? s.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Legenda */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Legenda
            </span>
            <CopyButton text={content.caption} label="Copiar" />
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {content.caption}
          </p>
        </div>

        {/* CTA */}
        {content.cta && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
            <Megaphone className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium">{content.cta}</span>
          </div>
        )}

        {/* Hashtags */}
        {content.hashtags && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                Hashtags
              </span>
              <CopyButton text={content.hashtags} label="Copiar" />
            </div>
            <p className="text-sm leading-relaxed text-primary">
              {content.hashtags}
            </p>
          </div>
        )}

        {/* Exportação de arte */}
        <ArtExport contentId={content.id} />

        {/* Rodapé */}
        <div className="flex justify-end border-t border-border pt-3">
          <CopyButton text={fullText} label="Copiar tudo" />
        </div>
      </CardContent>
    </Card>
  )
}
