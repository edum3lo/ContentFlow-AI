import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandForm } from '@/components/dashboard/brand-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_name, brand_logo_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Marca</h2>
        <p className="mt-1 text-muted-foreground">
          Seu nome e logotipo aparecem em todas as artes geradas — no lugar de
          &ldquo;ContentFlow AI&rdquo;. Configure uma vez e vale pra tudo.
        </p>
      </div>

      <BrandForm
        initialName={profile?.brand_name ?? ''}
        initialLogoUrl={profile?.brand_logo_url ?? null}
      />
    </div>
  )
}
