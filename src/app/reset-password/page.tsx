import Link from 'next/link'
import { Sparkles, ShieldAlert } from 'lucide-react'
import { updatePassword } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/server'
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

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 glow-primary opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-30 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" />

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
          {!user ? (
            <>
              <CardHeader className="space-y-1 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <CardTitle className="text-lg">Link inválido ou expirado</CardTitle>
                <CardDescription>
                  Este link de recuperação não é mais válido. Solicite um novo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/forgot-password">
                  <Button size="lg" className="w-full font-semibold">
                    Solicitar novo link
                  </Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-lg">Criar nova senha</CardTitle>
                <CardDescription>
                  Defina uma nova senha para sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Mínimo de 6 caracteres"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <Input
                      id="confirm"
                      name="confirm"
                      type="password"
                      required
                    />
                  </div>

                  {sp?.error && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                      {sp.error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    formAction={updatePassword}
                    size="lg"
                    className="w-full font-semibold"
                  >
                    Salvar nova senha
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
