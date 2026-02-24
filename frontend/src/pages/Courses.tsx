import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCourses, getCourse, syncCourses } from '../api/courses'
import { listInstructors } from '../api/instructors'
import { listAssignments } from '../api/assignments'
import Pagination from '../components/Pagination'
import type { Course } from '../types'

const assignmentStatusColors: Record<string, string> = {
  '배정 완료': 'bg-green-50 text-green-700',
  '배정 미완료': 'bg-orange-50 text-orange-700',
}

export default function Courses() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<'date' | 'title' | 'assignment'>('date')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses,
  })

  const { data: courseDetail } = useQuery({
    queryKey: ['course', selectedCourseId],
    queryFn: () => getCourse(selectedCourseId!),
    enabled: !!selectedCourseId,
  })

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => listInstructors(),
  })

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: listAssignments,
  })

  const syncMutation = useMutation({
    mutationFn: syncCourses,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      alert(`강의 동기화 완료: 교육 ${result.courses}건, 일정 ${result.schedules}건, 배정 ${result.assignments}건`)
    },
    onError: (err) => {
      alert(`동기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    },
  })

  const sortedFiltered = useMemo(() => {
    let result = courses.filter((c: Course) => {
      if (statusFilter !== 'all' && c.assignment_status !== statusFilter) return false
      if (searchQuery) {
        return c.title.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortKey === 'date') {
        if (!a.lecture_start && !b.lecture_start) return 0
        if (!a.lecture_start) return 1
        if (!b.lecture_start) return -1
        return b.lecture_start.localeCompare(a.lecture_start)
      }
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title, 'ko')
      }
      // assignment: 미완료 우선 → 배정률 오름차순
      const statusA = a.assignment_status === '배정 완료' ? 1 : 0
      const statusB = b.assignment_status === '배정 완료' ? 1 : 0
      if (statusA !== statusB) return statusA - statusB
      const rateA = a.total_dates ? (a.assigned_dates ?? 0) / a.total_dates : 0
      const rateB = b.total_dates ? (b.assigned_dates ?? 0) / b.total_dates : 0
      return rateA - rateB
    })

    return result
  }, [courses, statusFilter, searchQuery, sortKey])

  const totalPages = Math.ceil(sortedFiltered.length / pageSize)
  const paged = sortedFiltered.slice((page - 1) * pageSize, page * pageSize)

  const selectedCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : null

  const selectedDates = courseDetail?.dates
    ? [...courseDetail.dates].sort((a, b) => a.day_number - b.day_number)
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">교육 일정</h2>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncMutation.isPending ? '동기화 중...' : '강의 동기화'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 교육 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              placeholder="교육명 검색..."
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <span className="text-sm text-gray-500">상태:</span>
            <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
              {['all', '배정 완료', '배정 미완료'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s === 'all' ? '전체' : s}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">정렬:</span>
            <select
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value as 'date' | 'title' | 'assignment'); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">교육 시작일순</option>
              <option value="title">교육명순</option>
              <option value="assignment">배정률순</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">{sortedFiltered.length}건</span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-400">불러오는 중...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">오류: {error instanceof Error ? error.message : '불러오기 실패'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">교육명</th>
                    <th className="pb-3 font-medium">교육 기간</th>
                    <th className="pb-3 font-medium">대상</th>
                    <th className="pb-3 font-medium">상태</th>
                    <th className="pb-3 font-medium">배정</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((course) => {
                    const isSelected = selectedCourseId === course.id
                    const periodLabel = course.lecture_start
                      ? course.lecture_end
                        ? `${course.lecture_start} ~ ${course.lecture_end}`
                        : course.lecture_start
                      : '-'
                    return (
                      <tr
                        key={course.id}
                        onClick={() => setSelectedCourseId(isSelected ? null : course.id)}
                        className={`border-b border-gray-100 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 font-medium text-gray-800">{course.title}</td>
                        <td className="py-3 text-gray-500 text-xs whitespace-nowrap">{periodLabel}</td>
                        <td className="py-3 text-gray-600">{course.target ?? '-'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${assignmentStatusColors[course.assignment_status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                            {course.assignment_status ?? '-'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">
                          {course.total_dates != null
                            ? `${course.assigned_dates ?? 0}/${course.total_dates}일`
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </div>

        {/* 교육 상세 / 날짜 */}
        <div className="bg-white rounded-lg shadow p-5">
          {selectedCourse ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{selectedCourse.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{selectedCourse.target}</p>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">배정 상태</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${assignmentStatusColors[selectedCourse.assignment_status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                    {selectedCourse.assignment_status ?? '-'}
                  </span>
                </div>
                {selectedCourse.notion_page_id && (
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`https://notion.so/${selectedCourse.notion_page_id.replace(/-/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 100 100" fill="currentColor"><path d="M6.6 12.3c4.3 3.5 5.9 3.3 14-2L81 3.6c3.3-2.3 1-5.9-5.3-4.3L21.1 10.2c-5.3 1.6-6.6 5-2.7 7.6l-2.7-1z"/><path d="M11.6 89.1V24.9c0-3.4 1.1-5 4.4-7.3L78.5 6c3.5-2.3 7.7-1.3 7.7 4.3v63c0 4.8-2.7 7-7.3 7.4L19.2 93c-4.8.7-7.6-1.6-7.6-5.5zm11.4-60.3c0-2.5.5-3.6 2-4.4l2.3-1.1c1.5-.7 3.3.3 3.3 2.3v55.3c0 2-1.2 3-3 2.7l-2.3-.5c-1.5-.4-2.3-1.8-2.3-3.5V28.8z"/></svg>
                      Notion 페이지
                    </a>
                    {selectedCourse.workbook_full_url && (
                      <a
                        href={selectedCourse.workbook_full_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        교안
                      </a>
                    )}
                  </div>
                )}
              </div>

              <h4 className="text-sm font-semibold text-gray-700 mb-3">교육 일정 ({selectedDates.length}일)</h4>
              <div className="space-y-2">
                {selectedDates.map((cd) => {
                  const dateAssignments = assignments.filter((a) => a.course_date_id === cd.id)
                  return (
                    <div key={cd.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">Day {cd.day_number}</span>
                        <span className="text-sm text-gray-500">{cd.date}</span>
                      </div>
                      {dateAssignments.length > 0 ? (
                        <div className="space-y-1">
                          {dateAssignments.map((a) => {
                            const inst = instructors.find((i) => i.id === a.instructor_id)
                            return (
                              <div key={a.id} className="flex items-center gap-2 text-sm">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{a.class_name}</span>
                                <span className="text-gray-700">{inst?.name ?? '-'}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">배정 없음</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              교육을 선택하면 상세 정보가 표시됩니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
