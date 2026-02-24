import type { Instructor } from '../types'
import { fetchWithAuth, handleResponse } from './client'

export interface InstructorSyncResult {
  tutors: number
}

export async function syncInstructors(): Promise<InstructorSyncResult> {
  const res = await fetchWithAuth('/api/instructors/sync', { method: 'POST' })
  return handleResponse<InstructorSyncResult>(res)
}

export async function listInstructors(isActive?: boolean): Promise<Instructor[]> {
  const params = new URLSearchParams()
  if (isActive !== undefined) params.set('is_active', String(isActive))
  const query = params.toString()
  const res = await fetchWithAuth(`/api/instructors${query ? `?${query}` : ''}`)
  return handleResponse<Instructor[]>(res)
}

export async function getInstructor(id: string): Promise<Instructor> {
  const res = await fetchWithAuth(`/api/instructors/${id}`)
  return handleResponse<Instructor>(res)
}

export async function createInstructor(data: {
  name: string
  email?: string | null
  phone?: string | null
  specialty?: string | null
  is_active?: boolean
}): Promise<Instructor> {
  const res = await fetchWithAuth('/api/instructors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Instructor>(res)
}

export async function updateInstructor(
  id: string,
  data: {
    name?: string
    email?: string | null
    phone?: string | null
    specialty?: string | null
    is_active?: boolean
  },
): Promise<Instructor> {
  const res = await fetchWithAuth(`/api/instructors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Instructor>(res)
}

export async function deleteInstructor(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/instructors/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
}

