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
      alert(`동기화 완료: ${result.synced}건 성공, ${result.errors}건 오류`)
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
          {syncMutation.isPending ? '동기화 중...' : 'Notion 동기화'}
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Notion ID</span>
                  <span className="text-gray-700 font-mono text-xs">{selectedCourse.notion_page_id}</span>
                </div>
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
