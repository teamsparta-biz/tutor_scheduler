export interface CalendarEvent {
  date: string
  instructor_id: string
  instructor_name: string
  course_id: string
  course_title: string
  course_status: string | null
  assignment_status: string | null
  class_name: string | null
  assignment_id: string
}

export interface CalendarResponse {
  events: CalendarEvent[]
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${response.status}`)
  }
  return response.json()
}

export async function getCalendar(startDate: string, endDate: string): Promise<CalendarResponse> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  const res = await fetch(`/api/calendar?${params}`)
  return handleResponse<CalendarResponse>(res)
}
