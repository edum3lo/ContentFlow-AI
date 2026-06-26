'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'

const LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#publico', label: 'Para quem é' },
]

export function LandingMobileMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          {/* Backdrop: fecha ao tocar fora */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-background/60 backdrop-blur-sm"
          />

          {/* Painel */}
          <div className="absolute inset-x-0 top-16 z-50 border-b border-border bg-background p-4 shadow-lg">
            <nav className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {l.label}
                </a>
              ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-lg px-3 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Entrar
                </Link>
                <Link
                  href="/login"
                  onClick={close}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
