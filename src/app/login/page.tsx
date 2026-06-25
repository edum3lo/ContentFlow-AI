import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 glow-primary opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-30 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" />

      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight font-heading">
            ContentFlow<span className="text-primary"> AI</span>
          </h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-lg">Entre na sua conta</CardTitle>
            <CardDescription>
              Use seu email para acessar o painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>

              {sp?.error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {sp.error}
                </p>
              )}
              {sp?.message && (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                  {sp.message}
                </p>
              )}

              <Button
                type="submit"
                formAction={login}
                size="lg"
                className="w-full font-semibold"
              >
                Entrar
              </Button>
              <Button
                type="submit"
                formAction={signup}
                variant="outline"
                size="lg"
                className="w-full font-semibold"
              >
                Criar conta
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos Termos e Política de
          Privacidade.
        </p>
        
        <p className="mt-12 text-center text-[10px] font-semibold uppercase tracking-widest text-primary/50">
          Dev by Eduardo Melo
        </p>
      </div>
    </div>
  )
}
