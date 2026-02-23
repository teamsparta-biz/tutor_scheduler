import type { Course, CourseDate } from '../types'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${response.status}`)
  }
  return response.json()
}

export interface CourseDetail extends Course {
  dates: CourseDate[]
}

export interface SyncResult {
  synced: number
  errors: number
}

export async function listCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses')
  return handleResponse<Course[]>(res)
}

export async function getCourse(id: string): Promise<CourseDetail> {
  const res = await fetch(`/api/courses/${id}`)
  return handleResponse<CourseDetail>(res)
}

export async function syncCourses(): Promise<SyncResult> {
  const res = await fetch('/api/courses/sync', { method: 'POST' })
  return handleResponse<SyncResult>(res)
}
