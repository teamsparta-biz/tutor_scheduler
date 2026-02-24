import { fetchWithAuth, handleResponse } from './client'

export type AvailabilityStatus = 'available' | 'unavailable'

export interface Availability {
  id: string
  instructor_id: string
  date: string
  status: AvailabilityStatus
  reason: string | null
}

export async function listAvailability(params: {
  instructor_id?: string
  start_date?: string
  end_date?: string
}): Promise<Availability[]> {
  const qs = new URLSearchParams()
  if (params.instructor_id) qs.set('instructor_id', params.instructor_id)
  if (params.start_date) qs.set('start_date', params.start_date)
  if (params.end_date) qs.set('end_date', params.end_date)
  const res = await fetchWithAuth(`/api/availability?${qs}`)
  return handleResponse<Availability[]>(res)
}

export async function createAvailability(data: {
  instructor_id: string
  date: string
  status?: AvailabilityStatus
  reason?: string | null
}): Promise<Availability> {
  const res = await fetchWithAuth('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Availability>(res)
}

export async function deleteAvailability(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/availability/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
}
