'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navRoutes, isRouteActive } from './nav-routes'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-lg font-semibold tracking-tight font-heading">
                  ContentFlow<span className="text-sidebar-primary"> AI</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
              {navRoutes.map((route) => {
                const active = isRouteActive(pathname, route.href)
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-primary/15 text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <route.icon
                      className={cn(
                        'h-5 w-5',
                        active
                          ? 'text-sidebar-primary'
                          : 'text-sidebar-foreground/50'
                      )}
                    />
                    {route.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 pb-6">
              <Link
                href="/dashboard/catalogs"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-lg bg-sidebar-primary px-3 py-3 text-sm font-medium text-sidebar-primary-foreground transition-colors hover:opacity-90"
              >
                Enviar catálogo
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
