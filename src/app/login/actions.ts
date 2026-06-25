'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Email ou senha incorretos.')
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error.message)
    redirect(
      '/login?error=' +
        encodeURIComponent(
          'Não foi possível criar a conta. Verifique os dados e tente novamente.'
        )
    )
  }

  if (authData?.session) {
    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  }

  redirect('/login?message=Verifique seu email para confirmar o cadastro.')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const headersList = await headers()
  const origin =
    headersList.get('origin') ?? `https://${headersList.get('host')}`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect(
      '/forgot-password?error=' +
        encodeURIComponent('Não foi possível enviar o email. Tente novamente.')
    )
  }

  redirect(
    '/forgot-password?message=' +
      encodeURIComponent(
        'Se houver uma conta com esse email, enviamos um link de recuperação.'
      )
  )
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 6) {
    redirect(
      '/reset-password?error=' +
        encodeURIComponent('A senha precisa ter ao menos 6 caracteres.')
    )
  }

  if (password !== confirm) {
    redirect(
      '/reset-password?error=' +
        encodeURIComponent('As senhas não coincidem.')
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(
      '/reset-password?error=' +
        encodeURIComponent(
          'Não foi possível atualizar a senha. O link pode ter expirado.'
        )
    )
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard?message=Senha atualizada com sucesso.')
}
