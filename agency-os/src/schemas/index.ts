import { z } from 'zod'

// ============================================================
// SETTINGS SCHEMA
// ============================================================
export const SettingsSchema = z.object({
  agency_name: z.string().min(1, 'Agency name is required').max(100),
  logo_url: z.string().url().nullable().optional(),
  address: z.string().max(500).default(''),
  phone: z.string().max(20).default(''),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  website: z.string().url('Invalid URL').or(z.literal('')).default(''),
  gst_number: z.string().max(20).default(''),
  bank_name: z.string().max(100).default(''),
  bank_account: z.string().max(30).default(''),
  bank_ifsc: z.string().max(20).default(''),
  upi_id: z.string().max(50).default(''),
  invoice_prefix: z.string().min(1).max(10).default('INV'),
  currency: z.string().length(3).default('INR'),
})
export type SettingsFormData = z.infer<typeof SettingsSchema>

// ============================================================
// CLIENT SCHEMA
// ============================================================
export const ClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  company_name: z.string().max(100).default(''),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  phone: z.string().max(20).default(''),
  website: z.string().url('Invalid URL').or(z.literal('')).default(''),
  address: z.string().max(500).default(''),
  gst_number: z.string().max(20).default(''),
  notes: z.string().max(5000).default(''),
  status: z.enum(['active', 'paused', 'expired', 'renewing_soon']).default('active'),
})
export type ClientFormData = z.infer<typeof ClientSchema>

// ============================================================
// SERVICE SCHEMA
// ============================================================
export const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100),
  category: z.string().max(50).default(''),
  description: z.string().max(1000).default(''),
  price: z.number().min(0, 'Price must be positive'),
  billing_type: z.enum(['one_time', 'monthly', 'quarterly', 'yearly']),
  status: z.enum(['active', 'inactive']).default('active'),
})
export type ServiceFormData = z.infer<typeof ServiceSchema>

// ============================================================
// CLIENT SERVICE SCHEMA
// ============================================================
export const ClientServiceSchema = z.object({
  client_id: z.string().uuid('Invalid client'),
  service_id: z.string().uuid().nullable().optional(),
  service_name: z.string().min(1, 'Service name is required').max(100),
  monthly_fee: z.number().min(0).default(0),
  one_time_fee: z.number().min(0).default(0),
  billing_cycle: z.enum(['one_time', 'monthly', 'quarterly', 'yearly']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['active', 'paused', 'expired']).default('active'),
})
export type ClientServiceFormData = z.infer<typeof ClientServiceSchema>

// ============================================================
// PAYMENT SCHEMA
// ============================================================
export const PaymentSchema = z.object({
  client_id: z.string().uuid('Invalid client'),
  client_service_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  payment_method: z.enum(['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other']).default('bank_transfer'),
  invoice_number: z.string().max(50).default(''),
  status: z.enum(['paid', 'pending', 'overdue', 'refunded']).default('paid'),
  notes: z.string().max(1000).default(''),
})
export type PaymentFormData = z.infer<typeof PaymentSchema>

// ============================================================
// INVOICE SCHEMA
// ============================================================
export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit_price: z.number().min(0, 'Price must be positive'),
  sort_order: z.number().int().default(0),
})

export const InvoiceSchema = z.object({
  client_id: z.string().uuid('Invalid client'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  tax_percentage: z.number().min(0).max(100).default(0),
  notes: z.string().max(2000).default(''),
  terms: z.string().max(2000).default(''),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
})
export type InvoiceFormData = z.infer<typeof InvoiceSchema>

// ============================================================
// PROJECT SCHEMA
// ============================================================
export const ProjectSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(2000).default(''),
  status: z.enum(['planning', 'in_progress', 'review', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  budget: z.number().min(0).default(0),
})
export type ProjectFormData = z.infer<typeof ProjectSchema>

// ============================================================
// TASK SCHEMA
// ============================================================
export const TaskSchema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).default(''),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sort_order: z.number().int().default(0),
})
export type TaskFormData = z.infer<typeof TaskSchema>

// ============================================================
// MEETING SCHEMA
// ============================================================
export const MeetingSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Meeting title is required').max(200),
  description: z.string().max(2000).default(''),
  meeting_link: z.string().url('Invalid URL').or(z.literal('')).default(''),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']).default('scheduled'),
  scheduled_at: z.string().datetime('Invalid datetime'),
  duration_minutes: z.number().int().min(5).max(480).default(60),
  notes: z.string().max(5000).default(''),
})
export type MeetingFormData = z.infer<typeof MeetingSchema>

// ============================================================
// GOAL SCHEMA
// ============================================================
export const GoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  description: z.string().max(1000).default(''),
  target_amount: z.number().positive('Target must be positive'),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  category: z.enum(['revenue', 'clients', 'sales', 'profit', 'custom']).default('revenue'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['active', 'achieved', 'paused', 'cancelled']).default('active'),
})
export type GoalFormData = z.infer<typeof GoalSchema>

// ============================================================
// REPORT SCHEMA
// ============================================================
export const ReportSchema = z.object({
  client_id: z.string().uuid('Invalid client'),
  report_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid month format'),
  ad_spend: z.number().min(0).default(0),
  leads_generated: z.number().int().min(0).default(0),
  appointments_booked: z.number().int().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
  revenue_generated: z.number().min(0).default(0),
  cpl: z.number().min(0).default(0),
  cpa: z.number().min(0).default(0),
  roas: z.number().min(0).default(0),
  notes: z.string().max(5000).default(''),
  achievements: z.string().max(5000).default(''),
  challenges: z.string().max(5000).default(''),
  next_month_strategy: z.string().max(5000).default(''),
})
export type ReportFormData = z.infer<typeof ReportSchema>

// ============================================================
// REVENUE ENTRY SCHEMA
// ============================================================
export const RevenueEntrySchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  payment_id: z.string().uuid().nullable().optional(),
  source: z.enum(['meta_ads', 'google_ads', 'website_dev', 'one_time', 'consulting', 'other']),
  amount: z.number().positive('Amount must be positive'),
  revenue_type: z.enum(['recurring', 'one_time']),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(500).default(''),
})
export type RevenueEntryFormData = z.infer<typeof RevenueEntrySchema>

// ============================================================
// EXPENSE SCHEMA
// ============================================================
export const ExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  category: z.string().max(50).default('other'),
  amount: z.number().positive('Amount must be positive'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(1000).default(''),
})
export type ExpenseFormData = z.infer<typeof ExpenseSchema>

// ============================================================
// AUTH SCHEMAS
// ============================================================
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
export type LoginFormData = z.infer<typeof LoginSchema>

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>

// ============================================================
// QUERY/FILTER SCHEMAS
// ============================================================
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const DateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const ClientFilterSchema = z.object({
  status: z.enum(['active', 'paused', 'expired', 'renewing_soon']).optional(),
  search: z.string().max(100).optional(),
}).merge(PaginationSchema)

export const PaymentFilterSchema = z.object({
  status: z.enum(['paid', 'pending', 'overdue', 'refunded']).optional(),
  client_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
}).merge(PaginationSchema).merge(DateRangeSchema)

export const InvoiceFilterSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  client_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
}).merge(PaginationSchema)
