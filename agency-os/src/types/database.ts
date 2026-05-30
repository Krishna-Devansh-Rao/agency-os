export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: Settings
        Insert: Omit<Settings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Settings, 'id' | 'user_id' | 'created_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'user_id' | 'created_at'>>
      }
      services: {
        Row: Service
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Service, 'id' | 'user_id' | 'created_at'>>
      }
      client_services: {
        Row: ClientService
        Insert: Omit<ClientService, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClientService, 'id' | 'user_id' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Payment, 'id' | 'user_id' | 'created_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invoice, 'id' | 'user_id' | 'created_at'>>
      }
      invoice_items: {
        Row: InvoiceItem
        Insert: Omit<InvoiceItem, 'id' | 'amount'>
        Update: Partial<Omit<InvoiceItem, 'id' | 'amount'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
      }
      meetings: {
        Row: Meeting
        Insert: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Meeting, 'id' | 'user_id' | 'created_at'>>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Report, 'id' | 'user_id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'user_id' | 'created_at'>>
      }
      revenue_entries: {
        Row: RevenueEntry
        Insert: Omit<RevenueEntry, 'id' | 'created_at'>
        Update: Partial<Omit<RevenueEntry, 'id' | 'user_id' | 'created_at'>>
      }
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}

// ============================================================
// ENTITY TYPES
// ============================================================

export interface Settings {
  id: string
  user_id: string
  agency_name: string
  logo_url: string | null
  address: string
  phone: string
  email: string
  website: string
  gst_number: string
  bank_name: string
  bank_account: string
  bank_ifsc: string
  upi_id: string
  signature_url: string | null
  invoice_prefix: string
  invoice_counter: number
  currency: string
  created_at: string
  updated_at: string
}

export type ClientStatus = 'active' | 'paused' | 'expired' | 'renewing_soon'

export interface Client {
  id: string
  user_id: string
  name: string
  company_name: string
  email: string
  phone: string
  website: string
  address: string
  gst_number: string
  notes: string
  status: ClientStatus
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type BillingType = 'one_time' | 'monthly' | 'quarterly' | 'yearly'
export type ServiceStatus = 'active' | 'inactive'

export interface Service {
  id: string
  user_id: string
  name: string
  category: string
  description: string
  price: number
  billing_type: BillingType
  status: ServiceStatus
  created_at: string
  updated_at: string
}

export interface ClientService {
  id: string
  user_id: string
  client_id: string
  service_id: string | null
  service_name: string
  monthly_fee: number
  one_time_fee: number
  billing_cycle: BillingType
  start_date: string
  renewal_date: string | null
  status: 'active' | 'paused' | 'expired'
  created_at: string
  updated_at: string
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'refunded'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other'

export interface Payment {
  id: string
  user_id: string
  client_id: string
  client_service_id: string | null
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  invoice_number: string
  status: PaymentStatus
  notes: string
  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_percentage: number
  tax_amount: number
  total: number
  notes: string
  terms: string
  paid_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
  id: string
  user_id: string
  client_id: string | null
  name: string
  description: string
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  budget: number
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed'

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  client_id: string | null
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

export interface Meeting {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string
  meeting_link: string
  status: MeetingStatus
  scheduled_at: string
  duration_minutes: number
  notes: string
  created_at: string
  updated_at: string
}

export type GoalCategory = 'revenue' | 'clients' | 'sales' | 'profit' | 'custom'
export type GoalStatus = 'active' | 'achieved' | 'paused' | 'cancelled'

export interface Goal {
  id: string
  user_id: string
  name: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string | null
  category: GoalCategory
  priority: Priority
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  user_id: string
  client_id: string
  report_month: string
  ad_spend: number
  leads_generated: number
  appointments_booked: number
  conversions: number
  revenue_generated: number
  cpl: number
  cpa: number
  roas: number
  notes: string
  achievements: string
  challenges: string
  next_month_strategy: string
  created_at: string
  updated_at: string
}

export type DocumentCategory = 'contract' | 'report' | 'invoice' | 'logo' | 'creative' | 'other'

export interface Document {
  id: string
  user_id: string
  client_id: string | null
  name: string
  description: string
  file_url: string
  file_path: string
  file_type: string
  file_size: number
  category: DocumentCategory
  created_at: string
  updated_at: string
}

export type RevenueSource = 'meta_ads' | 'google_ads' | 'website_dev' | 'one_time' | 'consulting' | 'other'

export interface RevenueEntry {
  id: string
  user_id: string
  client_id: string | null
  payment_id: string | null
  source: RevenueSource
  amount: number
  revenue_type: 'recurring' | 'one_time'
  entry_date: string
  description: string
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  title: string
  category: string
  amount: number
  expense_date: string
  notes: string
  created_at: string
  updated_at: string
}

// ============================================================
// EXTENDED TYPES (with joins)
// ============================================================

export interface ClientWithServices extends Client {
  client_services?: ClientService[]
  payments?: Payment[]
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[]
  client: Client
}

export interface ProjectWithTasks extends Project {
  tasks?: Task[]
  client?: Client | null
}

// ============================================================
// DASHBOARD ANALYTICS TYPE
// ============================================================

export interface DashboardAnalytics {
  active_clients: number
  total_clients: number
  total_revenue: number
  monthly_revenue: number
  yearly_revenue: number
  pending_payments: number
  active_projects: number
  upcoming_renewals: number
}

export interface GoalForecast {
  goal: Goal
  current_revenue: number
  remaining_revenue: number
  average_daily_revenue: number
  estimated_days: number
  estimated_completion_date: Date | null
  progress_percentage: number
}
