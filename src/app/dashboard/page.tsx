import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  FileText,
  Images,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [catalogsRes, productsRes, contentsRes, recentRes] = await Promise.all([
    supabase.from('catalogs').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('generated_contents').select('id', { count: 'exact', head: true }),
    supabase
      .from('catalogs')
      .select('id, original_filename, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    {
      label: 'Catálogos processados',
      value: catalogsRes.count ?? 0,
      icon: FileText,
      href: '/dashboard/catalogs',
      hint: 'arquivos enviados',
    },
    {
      label: 'Produtos extraídos',
      value: productsRes.count ?? 0,
      icon: Package,
      href: '/dashboard/products',
      hint: 'no seu banco',
    },
    {
      label: 'Conteúdos gerados',
      value: contentsRes.count ?? 0,
      icon: Images,
      href: '/dashboard/contents',
      hint: 'prontos para publicar',
    },
  ]

  const recent = recentRes.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">
          Visão geral dos seus catálogos, produtos e conteúdos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:border-primary/40 hover:ring-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight font-heading">
                  {s.value}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {s.hint}
                  <ArrowUpRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
                <FileText className="mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">Nada por aqui ainda</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Envie seu primeiro catálogo para começar.
                </p>
                <Link
                  href="/dashboard/catalogs"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Enviar catálogo
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <StatusIcon status={c.status} />
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium" title={c.original_filename}>
                          {c.original_filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <StatusLabel status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction href="/dashboard/catalogs" icon={FileText} label="Enviar catálogo" />
            <QuickAction href="/dashboard/products" icon={Package} label="Revisar produtos" />
            <QuickAction href="/dashboard/contents" icon={Images} label="Gerar conteúdo" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/50"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    error: 'Erro',
  }
  return (
    <span className="shrink-0 text-xs font-medium text-muted-foreground">
      {map[status] ?? status}
    </span>
  )
}
