import { useState } from 'react'
import { mockCourses, mockCourseDates, mockAssignments, mockInstructors } from '../mocks/data'

const statusColors: Record<string, string> = {
  '진행중': 'bg-blue-50 text-blue-700',
  '예정': 'bg-amber-50 text-amber-700',
  '완료': 'bg-gray-100 text-gray-500',
}

export default function Courses() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const filtered = mockCourses.filter((c) => {
    if (statusFilter === 'all') return true
    return c.status === statusFilter
  })

  const selectedCourse = selectedCourseId
    ? mockCourses.find((c) => c.id === selectedCourseId)
    : null

  const selectedDates = selectedCourseId
    ? mockCourseDates
        .filter((cd) => cd.course_id === selectedCourseId)
        .sort((a, b) => a.day_number - b.day_number)
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">교육 일정</h2>
        <button
          onClick={() => alert('프로토타입: Notion 동기화 예정')}
          className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Notion 동기화
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 교육 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">상태:</span>
            <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
              {['all', '진행중', '예정', '완료'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">교육명</th>
                  <th className="pb-3 font-medium">대상</th>
                  <th className="pb-3 font-medium">상태</th>
                  <th className="pb-3 font-medium">일수</th>
                  <th className="pb-3 font-medium">동기화</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => {
                  const dates = mockCourseDates.filter((cd) => cd.course_id === course.id)
                  const isSelected = selectedCourseId === course.id
                  return (
                    <tr
                      key={course.id}
                      onClick={() => setSelectedCourseId(isSelected ? null : course.id)}
                      className={`border-b border-gray-100 cursor-pointer transition ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 font-medium text-gray-800">{course.title}</td>
                      <td className="py-3 text-gray-600">{course.target ?? '-'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[course.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                          {course.status ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{dates.length}일</td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(course.synced_at).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 교육 상세 / 날짜 */}
        <div className="bg-white rounded-lg shadow p-5">
          {selectedCourse ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{selectedCourse.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{selectedCourse.target}</p>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">상태</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[selectedCourse.status ?? ''] ?? ''}`}>
                    {selectedCourse.status}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Notion ID</span>
                  <span className="text-gray-700 font-mono text-xs">{selectedCourse.notion_page_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">마지막 동기화</span>
                  <span className="text-gray-700">{new Date(selectedCourse.synced_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-700 mb-3">교육 일정 ({selectedDates.length}일)</h4>
              <div className="space-y-2">
                {selectedDates.map((cd) => {
                  const dateAssignments = mockAssignments.filter((a) => a.course_date_id === cd.id)
                  return (
                    <div key={cd.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">Day {cd.day_number}</span>
                        <span className="text-sm text-gray-500">{cd.date}</span>
                      </div>
                      {dateAssignments.length > 0 ? (
                        <div className="space-y-1">
                          {dateAssignments.map((a) => {
                            const inst = mockInstructors.find((i) => i.id === a.instructor_id)
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
