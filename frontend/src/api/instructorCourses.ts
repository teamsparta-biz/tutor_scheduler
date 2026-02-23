async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${response.status}`)
  }
  return response.json()
}

export interface InstructorCourseDate {
  date: string
  day_number: number
  place: string | null
  start_time: number | null
  end_time: number | null
  role: string
}

export interface InstructorCourse {
  course_id: string
  title: string
  notion_page_id: string
  workbook_full_url: string | null
  status: string | null
  students: number | null
  lecture_start: string | null
  lecture_end: string | null
  total_dates: number
  role: string
  dates: InstructorCourseDate[]
}

export interface PaginatedInstructorCourses {
  items: InstructorCourse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export async function listInstructorCourses(
  instructorId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedInstructorCourses> {
  const res = await fetch(
    `/api/instructors/${instructorId}/courses?page=${page}&page_size=${pageSize}`,
  )
  return handleResponse<PaginatedInstructorCourses>(res)
}
