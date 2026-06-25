'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Tag,
  Sparkles,
  Scale,
  Lightbulb,
  Quote,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildCalendarPlan,
  CALENDAR_THEMES,
  CONTENT_DURATIONS,
  PLATFORM_TIMES,
  type Platform,
} from '@/lib/calendar'

// Ícones associados aos temas por `key` (a lógica pura não conhece React)
const THEME_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  produto: Package,
  promocao: Tag,
  beneficios: Sparkles,
  comparacao: Scale,
  curiosidade: Lightbulb,
  depoimento: Quote,
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export function CalendarPlanner() {
  const [duration, setDuration] = useState<number>(15)
  const [platform, setPlatform] = useState<Platform>('instagram')

  const times = PLATFORM_TIMES[platform]
  const plan = useMemo(
    () => buildCalendarPlan(duration, times),
    [duration, times]
  )

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Duração do plano</p>
          <div className="flex gap-1.5">
            {CONTENT_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  duration === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {d} dias
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Rede e horários sugeridos</p>
          <div className="flex gap-1.5">
            {(Object.keys(PLATFORM_TIMES) as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  platform === p
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 text-primary" />
        Melhores horários no {PLATFORM_LABELS[platform]}:
        <span className="font-medium text-foreground">{times.join(' • ')}</span>
      </div>

      {/* Plano */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {plan.map(({ date, themeIndex, time }, i) => {
            const theme = CALENDAR_THEMES[themeIndex]
            const Icon = THEME_ICONS[theme.key]
            return (
              <li
                key={i}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex w-12 shrink-0 flex-col items-center">
                  <span className="text-xs text-muted-foreground">
                    {WEEKDAYS[date.getDay()]}
                  </span>
                  <span className="text-lg font-semibold leading-tight font-heading">
                    {date.getDate()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {MONTHS[date.getMonth()]}
                  </span>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{theme.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {theme.format} • sugerido às {time}
                  </p>
                </div>

                <Link
                  href="/dashboard/contents"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Criar
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
