import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ContentGenerator } from '@/components/dashboard/content-generator'
import {
  ContentCard,
  type GeneratedContent,
} from '@/components/dashboard/content-card'

export default async function ContentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [productsRes, contentsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, price, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    supabase
      .from('generated_contents')
      .select('*, product:products(name)')
      .order('created_at', { ascending: false }),
  ])

  const products = productsRes.data ?? []
  const contents = (contentsRes.data ?? []) as unknown as GeneratedContent[]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Conteúdos</h2>
        <p className="mt-1 text-muted-foreground">
          Gere posts, stories e carrosséis prontos a partir dos seus produtos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Painel de geração */}
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Gerar conteúdo</CardTitle>
            <CardDescription>
              Escolha o tipo e os produtos. A IA cria título, legenda, hashtags
              e CTA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentGenerator products={products} />
          </CardContent>
        </Card>

        {/* Lista de conteúdos gerados */}
        <div className="space-y-4 lg:col-span-2">
          {contents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">Nenhum conteúdo gerado ainda</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Selecione um produto ao lado e clique em &ldquo;Gerar
                conteúdo&rdquo; para ver a mágica acontecer.
              </p>
            </div>
          ) : (
            contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
