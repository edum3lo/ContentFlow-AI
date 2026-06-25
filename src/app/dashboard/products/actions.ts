'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { success: true } | { error: string }

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

function revalidate() {
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/contents')
  revalidatePath('/dashboard')
}

export async function updateProduct(
  id: string,
  values: {
    name: string
    category: string
    price: number
    brand: string | null
  }
): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Não autorizado' }

  const name = values.name?.trim()
  const category = values.category?.trim() || 'Geral'

  if (!name) return { error: 'O nome é obrigatório' }
  if (!Number.isFinite(values.price) || values.price < 0) {
    return { error: 'Informe um preço válido' }
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      category,
      price: values.price,
      brand: values.brand?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Falha ao salvar o produto' }

  revalidate()
  return { success: true }
}

export async function setProductStatus(
  id: string,
  status: 'review' | 'approved' | 'rejected'
): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('products')
    .update({
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Falha ao atualizar o status' }

  revalidate()
  return { success: true }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Falha ao excluir o produto' }

  revalidate()
  return { success: true }
}

export async function approveAllPending(): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('products')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('status', 'review')

  if (error) return { error: 'Falha ao aprovar os produtos' }

  revalidate()
  return { success: true }
}
