'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ClientSchema, ClientFilterSchema, type ClientFormData } from '@/schemas'
import type { Client } from '@/types/database'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, userId: user.id }
}

// ============================================================
// GET CLIENTS (paginated + filtered)
// ============================================================
export async function getClients(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const { supabase, userId } = await getUserId()

  const parsed = ClientFilterSchema.safeParse(params ?? {})
  if (!parsed.success) return { clients: [], total: 0, error: 'Invalid parameters' }
  const { status, search, page, limit } = parsed.data

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return { clients: [], total: 0, error: error.message }

  return { clients: data as Client[], total: count ?? 0 }
}

// ============================================================
// GET SINGLE CLIENT (with services + payment summary)
// ============================================================
export async function getClient(clientId: string): Promise<ActionResult<Client & {
  client_services: any[]
  total_revenue: number
  total_paid: number
  pending_balance: number
}>> {
  const { supabase, userId } = await getUserId()

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_services(*),
      payments(amount, status)
    `)
    .eq('id', clientId)
    .eq('user_id', userId)
    .single()

  if (error) return { success: false, error: error.message }
  if (!client) return { success: false, error: 'Client not found' }

  const payments = (client as any).payments ?? []
  const total_paid = payments
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const pending_balance = payments
    .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  return {
    success: true,
    data: {
      ...client,
      total_revenue: total_paid,
      total_paid,
      pending_balance,
    } as any,
  }
}

// ============================================================
// CREATE CLIENT
// ============================================================
export async function createClient_action(formData: ClientFormData): Promise<ActionResult<Client>> {
  const { supabase, userId } = await getUserId()

  const parsed = ClientSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard')
  return { success: true, data: data as Client }
}

// ============================================================
// UPDATE CLIENT
// ============================================================
export async function updateClient(clientId: string, formData: Partial<ClientFormData>): Promise<ActionResult<Client>> {
  const { supabase, userId } = await getUserId()

  const parsed = ClientSchema.partial().safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { data, error } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', clientId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true, data: data as Client }
}

// ============================================================
// DELETE CLIENT
// ============================================================
export async function deleteClient(clientId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

// ============================================================
// GET CLIENTS EXPIRING SOON
// ============================================================
export async function getExpiringClients(days = 30) {
  const { supabase, userId } = await getUserId()

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase
    .from('client_services')
    .select(`
      *,
      clients(id, name, company_name, email, phone, status)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('renewal_date', new Date().toISOString().split('T')[0])
    .lte('renewal_date', futureDate.toISOString().split('T')[0])
    .order('renewal_date', { ascending: true })

  if (error) return []
  return data ?? []
}
