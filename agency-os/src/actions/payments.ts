'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PaymentSchema, type PaymentFormData } from '@/schemas'
import type { Payment } from '@/types/database'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, userId: user.id }
}

export async function getPayments(params?: {
  client_id?: string
  status?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) {
  const { supabase, userId } = await getUserId()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20

  let query = supabase
    .from('payments')
    .select(`
      *,
      clients(id, name, company_name)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('payment_date', { ascending: false })

  if (params?.client_id) query = query.eq('client_id', params.client_id)
  if (params?.status) query = query.eq('status', params.status)
  if (params?.from) query = query.gte('payment_date', params.from)
  if (params?.to) query = query.lte('payment_date', params.to)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return { payments: [], total: 0 }
  return { payments: data ?? [], total: count ?? 0 }
}

export async function createPayment(formData: PaymentFormData): Promise<ActionResult<Payment>> {
  const { supabase, userId } = await getUserId()

  const parsed = PaymentSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { data, error } = await supabase
    .from('payments')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Auto-create revenue entry
  if (parsed.data.status === 'paid') {
    await supabase.from('revenue_entries').insert({
      user_id: userId,
      client_id: parsed.data.client_id,
      payment_id: (data as Payment).id,
      source: 'other',
      amount: parsed.data.amount,
      revenue_type: 'one_time',
      entry_date: parsed.data.payment_date,
      description: `Payment: ${parsed.data.invoice_number || 'Manual entry'}`,
    })
  }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard')
  return { success: true, data: data as Payment }
}

export async function updatePayment(paymentId: string, formData: Partial<PaymentFormData>): Promise<ActionResult<Payment>> {
  const { supabase, userId } = await getUserId()

  const { data, error } = await supabase
    .from('payments')
    .update(formData)
    .eq('id', paymentId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard')
  return { success: true, data: data as Payment }
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
