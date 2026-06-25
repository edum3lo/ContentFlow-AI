import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarPlanner } from '@/components/dashboard/calendar-planner'

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Calendário de conteúdo
        </h2>
        <p className="mt-1 text-muted-foreground">
          Gere um plano de postagens misturando temas e horários ideais para
          manter a consistência.
        </p>
      </div>

      <CalendarPlanner />
    </div>
  )
}
