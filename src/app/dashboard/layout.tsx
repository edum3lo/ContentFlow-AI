import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Onboarding: enquanto não definir a marca (nome), leva pra tela de boas-vindas.
  // Guia o usuário a configurar a identidade antes de usar o resto.
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_name')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_name) {
    redirect('/onboarding')
  }

  return (
    <div className="relative flex min-h-screen bg-muted/30">
      <div className="fixed inset-y-0 z-50 hidden w-64 md:flex md:flex-col">
        <Sidebar />
      </div>
      <main className="flex w-full flex-1 flex-col md:pl-64">
        <Header />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
