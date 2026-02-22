export interface Instructor {
  id: string
  name: string
  email: string | null
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
  synced_at: string
  created_at: string
  updated_at: string
}

export interface CourseDate {
  id: string
  course_id: string
  date: string
  day_number: number
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
