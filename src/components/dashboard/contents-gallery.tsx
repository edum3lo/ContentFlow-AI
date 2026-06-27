'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ContentCard, type GeneratedContent } from './content-card'
import { CONTENT_CATEGORIES } from '@/lib/categories'

// Tipo de conteúdo → formato (aba)
const FORMAT_OF: Record<string, 'feed' | 'reels' | 'carrossel'> = {
  post: 'feed',
  catalog: 'feed',
  story: 'reels',
  video: 'reels',
  carousel: 'carrossel',
}

const FORMAT_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'feed', label: 'Feed (1:1)' },
  { value: 'reels', label: 'Stories/Reels (9:16)' },
  { value: 'carrossel', label: 'Carrossel' },
]

export function ContentsGallery({
  contents,
}: {
  contents: GeneratedContent[]
}) {
  const [format, setFormat] = useState('all')
  const [category, setCategory] = useState('all')

  const visible = useMemo(
    () =>
      contents.filter((c) => {
        const fmt = FORMAT_OF[c.type] ?? 'feed'
        if (format !== 'all' && fmt !== format) return false
        if (category !== 'all' && c.category !== category) return false
        return true
      }),
    [contents, format, category]
  )

  return (
    <div className="space-y-4">
      {/* Filtro por formato */}
      <div className="flex flex-wrap gap-1.5">
        {FORMAT_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFormat(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              format === f.value
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            category === 'all'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}
        >
          Todas
        </button>
        {CONTENT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === c.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Nenhum conteúdo nesse filtro.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  )
}
