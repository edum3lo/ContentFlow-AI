import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadForm } from '@/components/dashboard/upload-form'
import { FileText, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default async function CatalogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obter catálogos do usuário
  const { data: catalogs } = await supabase
    .from('catalogs')
    .select('*')
    .order('created_at', { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-muted-foreground" />
      case 'processing': return <Loader2 className="w-4 h-4 text-primary animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'processing': return 'Processando'
      case 'completed': return 'Concluído'
      case 'error': return 'Erro'
      default: return status
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Catálogos</h2>
        <p className="mt-1 text-muted-foreground">
          Envie seus catálogos em PDF ou listas de preços em imagem para extração.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enviar novo arquivo</CardTitle>
            <CardDescription>
              A Inteligência Artificial irá ler o arquivo e extrair os produtos automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seus Arquivos</CardTitle>
            <CardDescription>
              Acompanhe o status de processamento dos seus catálogos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!catalogs || catalogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nenhum catálogo</p>
                <p className="text-xs text-muted-foreground">Você ainda não enviou nenhum arquivo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {catalogs.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex-shrink-0">
                        {getStatusIcon(cat.status)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate" title={cat.original_filename}>
                          {cat.original_filename}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(cat.created_at).toLocaleDateString('pt-BR')} • {getStatusText(cat.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
