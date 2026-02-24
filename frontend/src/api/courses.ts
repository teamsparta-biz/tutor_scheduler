import type { Course, CourseDate } from '../types'
import { fetchWithAuth, handleResponse } from './client'

export interface CourseDetail extends Course {
  dates: CourseDate[]
}

export interface CourseSyncResult {
  courses: number
  schedules: number
  assignments: number
}

export async function listCourses(): Promise<Course[]> {
  const res = await fetchWithAuth('/api/courses')
  return handleResponse<Course[]>(res)
}

export async function getCourse(id: string): Promise<CourseDetail> {
  const res = await fetchWithAuth(`/api/courses/${id}`)
  return handleResponse<CourseDetail>(res)
}

export async function syncCourses(): Promise<CourseSyncResult> {
  const res = await fetchWithAuth('/api/courses/sync', { method: 'POST' })
  return handleResponse<CourseSyncResult>(res)
}
