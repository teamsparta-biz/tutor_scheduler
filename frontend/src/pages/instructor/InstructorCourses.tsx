import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { listInstructorCourses, type InstructorCourse } from '../../api/instructorCourses'
import Pagination from '../../components/Pagination'

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const wd = WEEKDAY_NAMES[d.getDay()]
  return `${y}.${m}.${day} (${wd})`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day}`
}

function formatTime(n: number): string {
  const hours = Math.floor(n)
  const minutes = Math.round((n - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

type Filter = 'all' | 'upcoming' | 'completed'

const COMPLETED_STATUSES = new Set(['result_report', 'lecture_finish', 'tax_invoice'])

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  result_report: { label: '완료', cls: 'bg-green-100 text-green-700' },
  lecture_finish: { label: '완료', cls: 'bg-green-100 text-green-700' },
  tax_invoice: { label: '완료', cls: 'bg-green-100 text-green-700' },
  preparation: { label: '준비 중', cls: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: '진행 중', cls: 'bg-blue-100 text-blue-700' },
}

function getStatusBadge(status: string | null) {
  if (!status) return { label: '예정', cls: 'bg-gray-100 text-gray-600' }
  return STATUS_BADGE[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
}

function isCompleted(course: InstructorCourse): boolean {
  return COMPLETED_STATUSES.has(course.status ?? '')
}

function CourseCard({ course }: { course: InstructorCourse }) {
  const badge = getStatusBadge(course.status)
  const firstPlace = course.dates[0]?.place

  const periodLabel = course.lecture_start && course.lecture_end
    ? `${formatShortDate(course.lecture_start)}~${formatShortDate(course.lecture_end)}`
    : course.dates.length > 0
      ? `${formatShortDate(course.dates[0].date)}~${formatShortDate(course.dates[course.dates.length - 1].date)}`
      : '-'

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">{course.title}</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>{badge.label}</span>
      </div>

      {firstPlace && (
        <p className="text-sm text-gray-500 mb-3">{firstPlace}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 mb-3">
        <span>기간: {periodLabel}</span>
        <span className="text-gray-300">|</span>
        <span>일수: {course.total_dates}일</span>
        <span className="text-gray-300">|</span>
        <span>인원: {course.students ?? '-'}명</span>
      </div>

      {course.workbook_full_url && (
        <a
          href={course.workbook_full_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          교안 보기
        </a>
      )}

      <div className="space-y-1">
        {course.dates.map((d, i) => (
          <div key={i} className="flex items-center gap-4 text-sm py-1.5 border-t border-gray-100 first:border-t-0">
            <span className="text-gray-400 font-medium min-w-12">Day {d.day_number}</span>
            <span className="text-gray-700 min-w-32">{formatDate(d.date)}</span>
            {d.start_time != null && d.end_time != null && (
              <span className="text-gray-500 min-w-24">{formatTime(d.start_time)}~{formatTime(d.end_time)}</span>
            )}
            <span className="text-gray-500 flex-1">{d.place ?? '-'}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{d.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstructorCourses() {
  const { profile } = useAuth()
  const instructorId = profile?.instructor_id ?? null
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Filter>('all')
  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['instructor-courses', instructorId, page, pageSize],
    queryFn: () => listInstructorCourses(instructorId!, page, pageSize),
    enabled: !!instructorId,
  })

  const filteredItems = useMemo(() => {
    if (!data) return []
    if (filter === 'upcoming') return data.items.filter((c) => !isCompleted(c))
    if (filter === 'completed') return data.items.filter((c) => isCompleted(c))
    return data.items
  }, [data, filter])

  const filterOptions: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'upcoming', label: '예정' },
    { key: 'completed', label: '완료' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">배정 교육</h2>
        <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setFilter(opt.key); setPage(1) }}
              className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                filter === opt.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">
          오류: {error instanceof Error ? error.message : '불러오기 실패'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-gray-400">배정된 교육이 없습니다</div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredItems.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.total_pages} onChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}
