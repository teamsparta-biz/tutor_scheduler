export interface Instructor {
  id: string
  name: string
  email: string | null
  auth_email: string | null
  phone: string | null
  specialty: string | null
  is_active: boolean
  profile_id: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  notion_page_id: string
  title: string
  status: string | null
  target: string | null
  students: number | null
  lecture_start: string | null
  lecture_end: string | null
  workbook_full_url: string | null
  assignment_status: string | null
  total_dates: number | null
  assigned_dates: number | null
  manager: string | null
  manager_email: string | null
  sales_rep: string | null
  sales_rep_email: string | null
  synced_at: string
  created_at: string
  updated_at: string
}

export interface CourseDate {
  id: string
  course_id: string
  date: string
  day_number: number
  place: string | null
  start_time: number | null
  end_time: number | null
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  course_date_id: string
  instructor_id: string
  date: string
  class_name: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InstructorAvailability {
  id: string
  instructor_id: string
  date: string
  status: 'available' | 'unavailable' | 'pending'
  created_at: string
  updated_at: string
}
