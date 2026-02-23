import type { Assignment } from '../types'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${response.status}`)
  }
  return response.json()
}

export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetch('/api/assignments')
  return handleResponse<Assignment[]>(res)
}

export async function createAssignment(data: {
  course_date_id: string
  instructor_id: string
  date: string
  class_name?: string | null
}): Promise<Assignment> {
  const res = await fetch('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Assignment>(res)
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
}
