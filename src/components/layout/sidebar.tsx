'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navRoutes, isRouteActive } from './nav-routes'
import { ThemeToggle } from '@/components/theme-toggle'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-lg font-semibold tracking-tight font-heading">
          ContentFlow<span className="text-sidebar-primary"> AI</span>
        </span>
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/dashboard/catalogs"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo Catálogo
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navRoutes.map((route) => {
          const active = isRouteActive(pathname, route.href)
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary/15 text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <route.icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  active
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                )}
              />
              {route.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-6 flex flex-col gap-4">
        <div className="rounded-xl bg-sidebar-accent p-4">
          <p className="text-sm font-medium">Pronto para postar?</p>
          <p className="mt-1 text-xs text-sidebar-foreground/60">
            Envie um catálogo e gere conteúdo em minutos.
          </p>
          <Link
            href="/dashboard/catalogs"
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-sidebar-primary px-3 py-2 text-xs font-medium text-sidebar-primary-foreground transition-colors hover:opacity-90"
          >
            Enviar catálogo
          </Link>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-sidebar-foreground/60">Aparência</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
