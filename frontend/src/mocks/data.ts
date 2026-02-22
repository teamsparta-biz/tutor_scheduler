import type { Instructor, Course, CourseDate, Assignment } from '../types'

export const mockInstructors: Instructor[] = [
  {
    id: 'inst-1',
    name: '김민수',
    email: 'minsu.kim@example.com',
    phone: '010-1234-5678',
    specialty: 'JavaScript/React',
    is_active: true,
    profile_id: null,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'inst-2',
    name: '이서연',
    email: 'seoyeon.lee@example.com',
    phone: '010-2345-6789',
    specialty: 'Python/Django',
    is_active: true,
    profile_id: null,
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-02-01T09:00:00Z',
  },
  {
    id: 'inst-3',
    name: '박준혁',
    email: 'junhyuk.park@example.com',
    phone: '010-3456-7890',
    specialty: 'Java/Spring',
    is_active: true,
    profile_id: null,
    created_at: '2025-03-10T09:00:00Z',
    updated_at: '2025-03-10T09:00:00Z',
  },
  {
    id: 'inst-4',
    name: '최유진',
    email: 'yujin.choi@example.com',
    phone: '010-4567-8901',
    specialty: 'DevOps/Cloud',
    is_active: true,
    profile_id: null,
    created_at: '2025-04-20T09:00:00Z',
    updated_at: '2025-04-20T09:00:00Z',
  },
  {
    id: 'inst-5',
    name: '정하늘',
    email: 'haneul.jung@example.com',
    phone: '010-5678-9012',
    specialty: 'Data Science',
    is_active: false,
    profile_id: null,
    created_at: '2025-05-05T09:00:00Z',
    updated_at: '2026-01-10T09:00:00Z',
  },
]

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    notion_page_id: 'notion-abc-123',
    title: '프론트엔드 부트캠프 5기',
    status: '진행중',
    target: '비전공자 대상',
    synced_at: '2026-02-20T14:30:00Z',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-02-20T14:30:00Z',
  },
  {
    id: 'course-2',
    notion_page_id: 'notion-def-456',
    title: '백엔드 심화 과정 3기',
    status: '예정',
    target: '현직 개발자',
    synced_at: '2026-02-19T10:00:00Z',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-19T10:00:00Z',
  },
  {
    id: 'course-3',
    notion_page_id: 'notion-ghi-789',
    title: '데이터 분석 입문 2기',
    status: '완료',
    target: '마케터/기획자',
    synced_at: '2026-01-20T09:00:00Z',
    created_at: '2025-12-01T09:00:00Z',
    updated_at: '2026-01-20T09:00:00Z',
  },
]

export const mockCourseDates: CourseDate[] = [
  // Course 1: 프론트엔드 부트캠프 5기
  { id: 'cd-1', course_id: 'course-1', date: '2026-02-17', day_number: 1, created_at: '2026-01-10T09:00:00Z', updated_at: '2026-01-10T09:00:00Z' },
  { id: 'cd-2', course_id: 'course-1', date: '2026-02-18', day_number: 2, created_at: '2026-01-10T09:00:00Z', updated_at: '2026-01-10T09:00:00Z' },
  { id: 'cd-3', course_id: 'course-1', date: '2026-02-19', day_number: 3, created_at: '2026-01-10T09:00:00Z', updated_at: '2026-01-10T09:00:00Z' },
  // Course 2: 백엔드 심화 과정 3기
  { id: 'cd-4', course_id: 'course-2', date: '2026-02-18', day_number: 1, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
  { id: 'cd-5', course_id: 'course-2', date: '2026-02-19', day_number: 2, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
  { id: 'cd-6', course_id: 'course-2', date: '2026-02-20', day_number: 3, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
  // Course 3: 데이터 분석 입문 2기
  { id: 'cd-7', course_id: 'course-3', date: '2026-01-13', day_number: 1, created_at: '2025-12-01T09:00:00Z', updated_at: '2025-12-01T09:00:00Z' },
  { id: 'cd-8', course_id: 'course-3', date: '2026-01-14', day_number: 2, created_at: '2025-12-01T09:00:00Z', updated_at: '2025-12-01T09:00:00Z' },
]

export const mockAssignments: Assignment[] = [
  // Course 1, Feb 17
  { id: 'asgn-1', course_date_id: 'cd-1', instructor_id: 'inst-1', date: '2026-02-17', class_name: 'A반', created_by: null, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
  { id: 'asgn-2', course_date_id: 'cd-1', instructor_id: 'inst-2', date: '2026-02-17', class_name: 'B반', created_by: null, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
  // Course 1, Feb 18
  { id: 'asgn-3', course_date_id: 'cd-2', instructor_id: 'inst-1', date: '2026-02-18', class_name: 'A반', created_by: null, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
  { id: 'asgn-4', course_date_id: 'cd-2', instructor_id: 'inst-3', date: '2026-02-18', class_name: 'B반', created_by: null, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
  // Course 1, Feb 19
  { id: 'asgn-5', course_date_id: 'cd-3', instructor_id: 'inst-2', date: '2026-02-19', class_name: 'A반', created_by: null, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
  { id: 'asgn-6', course_date_id: 'cd-3', instructor_id: 'inst-4', date: '2026-02-19', class_name: 'B반', created_by: null, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
  // Course 2, Feb 18 — 김민수(inst-1)가 Course 1에도 배정 → 중복!
  { id: 'asgn-7', course_date_id: 'cd-4', instructor_id: 'inst-4', date: '2026-02-18', class_name: 'A반', created_by: null, created_at: '2026-02-12T09:00:00Z', updated_at: '2026-02-12T09:00:00Z' },
  { id: 'asgn-8', course_date_id: 'cd-4', instructor_id: 'inst-1', date: '2026-02-18', class_name: 'B반', created_by: null, created_at: '2026-02-12T09:00:00Z', updated_at: '2026-02-12T09:00:00Z' },
]
