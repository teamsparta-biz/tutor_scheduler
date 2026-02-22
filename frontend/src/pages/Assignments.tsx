import { mockCourses, mockCourseDates, mockAssignments, mockInstructors } from '../mocks/data'
import { useState } from 'react'

const activeCourses = mockCourses.filter((c) => c.status !== '완료')

export default function Assignments() {
  const [selectedCourseId, setSelectedCourseId] = useState(activeCourses[0]?.id ?? '')

  const dates = mockCourseDates
    .filter((cd) => cd.course_id === selectedCourseId)
    .sort((a, b) => a.day_number - b.day_number)

  // 중복 감지: 같은 날짜에 같은 강사가 여러 배정
  const duplicateKeys = new Set<string>()
  const dateInstructorCount = new Map<string, number>()
  for (const a of mockAssignments) {
    const key = `${a.date}::${a.instructor_id}`
    dateInstructorCount.set(key, (dateInstructorCount.get(key) ?? 0) + 1)
  }
  for (const [key, count] of dateInstructorCount) {
    if (count > 1) duplicateKeys.add(key)
  }

  const duplicateCount = duplicateKeys.size

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 배정</h2>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">교육 선택:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {activeCourses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        {duplicateCount > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm">
            중복 배정 {duplicateCount}건 감지
          </span>
        )}
      </div>

      <div className="space-y-4">
        {dates.map((cd) => {
          const dateAssignments = mockAssignments.filter((a) => a.course_date_id === cd.id)
          return (
            <div key={cd.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{cd.date}</h4>
                  <p className="text-sm text-gray-500">Day {cd.day_number}</p>
                </div>
                <button
                  onClick={() => alert('프로토타입: 강사 추가 예정')}
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  + 강사 추가
                </button>
              </div>
              <div className="space-y-2">
                {dateAssignments.length > 0 ? (
                  dateAssignments.map((a) => {
                    const instructor = mockInstructors.find((i) => i.id === a.instructor_id)
                    const isDuplicate = duplicateKeys.has(`${a.date}::${a.instructor_id}`)

                    return (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isDuplicate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                            {a.class_name}
                          </span>
                          <span className="text-gray-800">{instructor?.name ?? '-'}</span>
                          <span className="text-xs text-gray-400">{instructor?.specialty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDuplicate && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              중복 배정
                            </span>
                          )}
                          <button className="text-gray-400 hover:text-red-500 text-sm cursor-pointer">삭제</button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-400 py-2">배정된 강사가 없습니다</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
