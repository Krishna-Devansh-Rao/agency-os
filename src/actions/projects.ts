'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ProjectSchema, TaskSchema, type ProjectFormData, type TaskFormData } from '@/schemas'
import type { Project, Task } from '@/types/database'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, userId: user.id }
}

// ─── PROJECTS ─────────────────────────────────────────────────

export async function getProjects(params?: { status?: string; client_id?: string }) {
  const { supabase, userId } = await getUserId()

  let query = supabase
    .from('projects')
    .select('*, clients(id, name, company_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (params?.status) query = query.eq('status', params.status)
  if (params?.client_id) query = query.eq('client_id', params.client_id)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function createProject(formData: ProjectFormData): Promise<ActionResult<Project>> {
  const { supabase, userId } = await getUserId()

  const parsed = ProjectSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/projects')
  return { success: true, data: data as Project }
}

export async function updateProject(projectId: string, formData: Partial<ProjectFormData>): Promise<ActionResult<Project>> {
  const { supabase, userId } = await getUserId()

  const { data, error } = await supabase
    .from('projects')
    .update(formData)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/projects')
  return { success: true, data: data as Project }
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()

  const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', userId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/projects')
  return { success: true, data: undefined }
}

// ─── TASKS ────────────────────────────────────────────────────

export async function getTasks(params?: { project_id?: string; status?: string; client_id?: string }) {
  const { supabase, userId } = await getUserId()

  let query = supabase
    .from('tasks')
    .select('*, projects(id, name), clients(id, name)')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (params?.project_id) query = query.eq('project_id', params.project_id)
  if (params?.status) query = query.eq('status', params.status)
  if (params?.client_id) query = query.eq('client_id', params.client_id)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function createTask(formData: TaskFormData): Promise<ActionResult<Task>> {
  const { supabase, userId } = await getUserId()

  const parsed = TaskSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/projects')
  return { success: true, data: data as Task }
}

export async function updateTask(taskId: string, formData: Partial<TaskFormData>): Promise<ActionResult<Task>> {
  const { supabase, userId } = await getUserId()

  const updateData: any = { ...formData }
  if (formData.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (formData.status && formData.status !== 'completed') {
    updateData.completed_at = null
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/projects')
  return { success: true, data: data as Task }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()

  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/tasks')
  return { success: true, data: undefined }
}

// Batch update sort orders for kanban drag-drop
export async function updateTasksOrder(updates: { id: string; status: string; sort_order: number }[]): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()

  const promises = updates.map(u =>
    supabase.from('tasks').update({ status: u.status, sort_order: u.sort_order }).eq('id', u.id).eq('user_id', userId)
  )

  const results = await Promise.all(promises)
  const failed = results.find(r => r.error)
  if (failed?.error) return { success: false, error: failed.error.message }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/projects')
  return { success: true, data: undefined }
}
