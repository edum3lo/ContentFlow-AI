import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Já configurou a marca? Então não precisa de onboarding.
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url')
    .eq('id', user.id)
    .single()

  if (profile?.brand_name) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bem-vindo! Vamos configurar sua marca
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Antes de começar, diga o nome do seu negócio e envie seu logo. Eles
            vão aparecer em todas as artes que você gerar — assim cada post já
            sai com a sua cara.
          </p>
        </div>

        <OnboardingForm
          initialLogoUrl={profile?.brand_logo_url ?? null}
        />
      </div>
    </div>
  )
}
