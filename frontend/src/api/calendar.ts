import { fetchWithAuth, handleResponse } from './client'

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
  notion_page_id: string
  workbook_full_url: string | null
  manager: string | null
  sales_rep: string | null
}

export interface CalendarResponse {
  events: CalendarEvent[]
}

export async function getCalendar(startDate: string, endDate: string): Promise<CalendarResponse> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  const res = await fetchWithAuth(`/api/calendar?${params}`)
  return handleResponse<CalendarResponse>(res)
}
