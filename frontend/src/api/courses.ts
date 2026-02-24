import type { Course, CourseDate } from '../types'
import { fetchWithAuth, handleResponse } from './client'

export interface CourseDetail extends Course {
  dates: CourseDate[]
}

export interface SyncResult {
  synced: number
  errors: number
}

export async function listCourses(): Promise<Course[]> {
  const res = await fetchWithAuth('/api/courses')
  return handleResponse<Course[]>(res)
}

export async function getCourse(id: string): Promise<CourseDetail> {
  const res = await fetchWithAuth(`/api/courses/${id}`)
  return handleResponse<CourseDetail>(res)
}

export async function syncCourses(): Promise<SyncResult> {
  const res = await fetchWithAuth('/api/courses/sync', { method: 'POST' })
  return handleResponse<SyncResult>(res)
}
