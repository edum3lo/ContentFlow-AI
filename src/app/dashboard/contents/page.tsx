import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { type GeneratedContent } from '@/components/dashboard/content-card'
import { PostsGallery } from '@/components/dashboard/posts-gallery'

export default async function ContentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [productsRes, contentsRes, profileRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, price, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    // Sem embed de propósito (evita ambiguidade de relação no PostgREST):
    // buscamos os nomes de produto em uma 2ª query e juntamos no código.
    supabase
      .from('generated_contents')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('brand_name').eq('id', user.id).single(),
  ])

  const products = productsRes.data ?? []
  const rawContents = contentsRes.data ?? []

  const productIds = [
    ...new Set(
      rawContents
        .map((c) => c.product_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ]
  const productNameById = new Map<string, string>()
  if (productIds.length > 0) {
    const { data: prods } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds)
    for (const p of prods ?? []) productNameById.set(p.id, p.name)
  }

  const contents = rawContents.map((c) => ({
    ...c,
    product: c.product_id
      ? { name: productNameById.get(c.product_id) ?? null }
      : null,
  })) as unknown as GeneratedContent[]

  return (
    <div className="mx-auto max-w-7xl">
      <PostsGallery
        contents={contents}
        products={products}
        brandName={profileRes.data?.brand_name ?? null}
      />
    </div>
  )
}
