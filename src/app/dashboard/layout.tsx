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
