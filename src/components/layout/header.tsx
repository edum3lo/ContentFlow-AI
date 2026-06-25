import { User, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/layout/mobile-nav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-1 md:hidden">
        <MobileNav />
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight font-heading">
            ContentFlow<span className="text-primary"> AI</span>
          </span>
        </Link>
      </div>
      <div className="hidden flex-1 md:block" />
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative size-9 rounded-full"
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </span>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56" align="end">
            {/* Bloco de info da conta: um <div> simples — o GroupLabel do
                base-ui exigiria estar dentro de um <Menu.Group>. */}
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">Conta</p>
              <p className="mt-1 text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <form action={signOut}>
                  <button type="submit" className="w-full text-left">
                    Sair
                  </button>
                </form>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
