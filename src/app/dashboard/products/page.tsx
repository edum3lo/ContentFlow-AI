import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { ProductsTable } from '@/components/dashboard/products-table'

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, brand, price, confidence_score, status')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Produtos</h2>
        <p className="mt-1 text-muted-foreground">
          Revise, edite e aprove os produtos extraídos pela IA. Só produtos
          aprovados são recomendados para gerar conteúdo.
        </p>
      </div>

      {!products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium">Nenhum produto ainda</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Envie um catálogo para a IA extrair os produtos automaticamente.
          </p>
          <Link
            href="/dashboard/catalogs"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Enviar catálogo
          </Link>
        </div>
      ) : (
        <ProductsTable products={products} />
      )}
    </div>
  )
}
