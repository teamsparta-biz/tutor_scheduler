import type { Assignment } from '../types'
import { fetchWithAuth, handleResponse } from './client'

export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetchWithAuth('/api/assignments')
  return handleResponse<Assignment[]>(res)
}

export async function createAssignment(data: {
  course_date_id: string
  instructor_id: string
  date: string
  class_name?: string | null
}): Promise<Assignment> {
  const res = await fetchWithAuth('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Assignment>(res)
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/assignments/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
}
