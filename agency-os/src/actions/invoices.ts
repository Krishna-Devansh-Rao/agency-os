'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { InvoiceSchema, type InvoiceFormData } from '@/schemas'
import type { Invoice, InvoiceWithItems } from '@/types/database'

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
// GET INVOICES
// ============================================================
export async function getInvoices(params?: {
  status?: string
  client_id?: string
  search?: string
  page?: number
  limit?: number
}) {
  const { supabase, userId } = await getUserId()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20

  let query = supabase
    .from('invoices')
    .select(`
      *,
      clients(id, name, company_name, email)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (params?.status) query = query.eq('status', params.status)
  if (params?.client_id) query = query.eq('client_id', params.client_id)
  if (params?.search) query = query.ilike('invoice_number', `%${params.search}%`)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return { invoices: [], total: 0, error: error.message }

  return { invoices: data ?? [], total: count ?? 0 }
}

// ============================================================
// GET SINGLE INVOICE WITH ITEMS
// ============================================================
export async function getInvoice(invoiceId: string): Promise<ActionResult<InvoiceWithItems>> {
  const { supabase, userId } = await getUserId()

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items(* ORDER BY sort_order ASC),
      clients(*)
    `)
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as InvoiceWithItems }
}

// ============================================================
// CREATE INVOICE (with auto-numbering via DB function)
// ============================================================
export async function createInvoice(formData: InvoiceFormData): Promise<ActionResult<Invoice>> {
  const { supabase, userId } = await getUserId()

  const parsed = InvoiceSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { items, tax_percentage, ...invoiceData } = parsed.data

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const tax_amount = (subtotal * tax_percentage) / 100
  const total = subtotal + tax_amount

  // Generate invoice number using DB function (with transaction lock)
  const { data: invoiceNumber, error: numberError } = await supabase
    .rpc('generate_invoice_number', { p_user_id: userId })

  if (numberError) return { success: false, error: 'Failed to generate invoice number' }

  // Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      user_id: userId,
      invoice_number: invoiceNumber,
      subtotal,
      tax_percentage,
      tax_amount,
      total,
      status: 'draft',
    })
    .select()
    .single()

  if (invoiceError) return { success: false, error: invoiceError.message }

  // Insert invoice items
  const itemsToInsert = items.map((item, index) => ({
    invoice_id: (invoice as Invoice).id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Rollback invoice if items fail
    await supabase.from('invoices').delete().eq('id', (invoice as Invoice).id)
    return { success: false, error: 'Failed to save invoice items' }
  }

  revalidatePath('/dashboard/invoices')
  return { success: true, data: invoice as Invoice }
}

// ============================================================
// UPDATE INVOICE STATUS
// ============================================================
export async function updateInvoiceStatus(
  invoiceId: string,
  status: Invoice['status']
): Promise<ActionResult<Invoice>> {
  const { supabase, userId } = await getUserId()

  const updateData: any = { status }
  if (status === 'paid') updateData.paid_at = new Date().toISOString()
  if (status === 'sent') updateData.sent_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  return { success: true, data: data as Invoice }
}

// ============================================================
// DUPLICATE INVOICE
// ============================================================
export async function duplicateInvoice(invoiceId: string): Promise<ActionResult<Invoice>> {
  const { supabase, userId } = await getUserId()

  // Fetch original
  const { data: original, error: fetchError } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !original) return { success: false, error: 'Invoice not found' }

  // Generate new number
  const { data: newNumber, error: numberError } = await supabase
    .rpc('generate_invoice_number', { p_user_id: userId })
  if (numberError) return { success: false, error: 'Failed to generate invoice number' }

  const today = new Date().toISOString().split('T')[0]

  // Insert new invoice
  const { data: newInvoice, error: insertError } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: original.client_id,
      invoice_number: newNumber,
      status: 'draft',
      issue_date: today,
      due_date: original.due_date,
      subtotal: original.subtotal,
      tax_percentage: original.tax_percentage,
      tax_amount: original.tax_amount,
      total: original.total,
      notes: original.notes,
      terms: original.terms,
    })
    .select()
    .single()

  if (insertError) return { success: false, error: insertError.message }

  // Duplicate items
  if (original.invoice_items?.length) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      original.invoice_items.map((item: any) => ({
        invoice_id: (newInvoice as Invoice).id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: item.sort_order,
      }))
    )
    if (itemsError) {
      await supabase.from('invoices').delete().eq('id', (newInvoice as Invoice).id)
      return { success: false, error: 'Failed to duplicate items' }
    }
  }

  revalidatePath('/dashboard/invoices')
  return { success: true, data: newInvoice as Invoice }
}

// ============================================================
// DELETE INVOICE
// ============================================================
export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/invoices')
  return { success: true, data: undefined }
}
