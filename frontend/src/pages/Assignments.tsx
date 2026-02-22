import { useState } from 'react'
import { mockCourses, mockCourseDates, mockAssignments, mockInstructors } from '../mocks/data'

function ABToggle({ variant, onChange }: { variant: 'A' | 'B'; onChange: (v: 'A' | 'B') => void }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
      <button
        onClick={() => onChange('A')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
          variant === 'A' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        A안
      </button>
      <button
        onClick={() => onChange('B')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
          variant === 'B' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        B안
      </button>
    </div>
  )
}

// 날짜별 강사 중복 체크
function getDuplicates() {
  const dateMap = new Map<string, { instructorId: string; assignments: typeof mockAssignments }[]>()
  for (const a of mockAssignments) {
    if (!dateMap.has(a.date)) dateMap.set(a.date, [])
    dateMap.get(a.date)!.push({ instructorId: a.instructor_id, assignments: [a] })
  }
  const duplicates = new Set<string>()
  for (const [, entries] of dateMap) {
    const instCount = new Map<string, number>()
    for (const e of entries) {
      instCount.set(e.instructorId, (instCount.get(e.instructorId) ?? 0) + 1)
    }
    for (const [instId, count] of instCount) {
      if (count > 1) duplicates.add(instId)
    }
  }
  return duplicates
}

const duplicateInstructors = getDuplicates()

const activeCourses = mockCourses.filter((c) => c.status !== '완료')

function AssignmentMatrixView({ courseId }: { courseId: string }) {
  const dates = mockCourseDates
    .filter((cd) => cd.course_id === courseId)
    .sort((a, b) => a.day_number - b.day_number)

  const classNames = [...new Set(mockAssignments.filter((a) => dates.some((d) => d.id === a.course_date_id)).map((a) => a.class_name))].filter(Boolean) as string[]
  if (classNames.length === 0) classNames.push('A반', 'B반')

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">배정 매트릭스</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-left text-gray-600 font-medium">날짜</th>
              {classNames.map((cn) => (
                <th key={cn} className="border border-gray-200 bg-gray-50 px-4 py-2 text-center text-gray-600 font-medium">{cn}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((cd) => (
              <tr key={cd.id}>
                <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                  <div>{cd.date}</div>
                  <div className="text-xs text-gray-400">Day {cd.day_number}</div>
                </td>
                {classNames.map((cn) => {
                  const assignment = mockAssignments.find(
                    (a) => a.course_date_id === cd.id && a.class_name === cn
                  )
                  const instructor = assignment
                    ? mockInstructors.find((i) => i.id === assignment.instructor_id)
                    : null
                  const isDuplicate = assignment && duplicateInstructors.has(assignment.instructor_id)
                    && mockAssignments.filter((a) => a.date === assignment.date && a.instructor_id === assignment.instructor_id).length > 1

                  return (
                    <td key={cn} className={`border border-gray-200 px-4 py-3 text-center ${isDuplicate ? 'bg-red-50' : ''}`}>
                      {instructor ? (
                        <div>
                          <select
                            defaultValue={instructor.id}
                            className={`text-sm border rounded px-2 py-1 w-full ${isDuplicate ? 'border-red-400 text-red-700' : 'border-gray-300'}`}
                          >
                            {mockInstructors.filter((i) => i.is_active).map((i) => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </select>
                          {isDuplicate && (
                            <p className="text-xs text-red-600 mt-1 font-medium">중복 배정!</p>
                          )}
                        </div>
                      ) : (
                        <select className="text-sm border border-gray-300 rounded px-2 py-1 w-full text-gray-400">
                          <option value="">미배정</option>
                          {mockInstructors.filter((i) => i.is_active).map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AssignmentCardView({ courseId }: { courseId: string }) {
  const dates = mockCourseDates
    .filter((cd) => cd.course_id === courseId)
    .sort((a, b) => a.day_number - b.day_number)

  return (
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
                  const isDuplicate = mockAssignments.filter(
                    (oa) => oa.date === a.date && oa.instructor_id === a.instructor_id
                  ).length > 1

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
  )
}

export default function Assignments() {
  const [variant, setVariant] = useState<'A' | 'B'>('A')
  const [selectedCourseId, setSelectedCourseId] = useState(activeCourses[0]?.id ?? '')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 배정</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">레이아웃:</span>
          <ABToggle variant={variant} onChange={setVariant} />
        </div>
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
        {duplicateInstructors.size > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm">
            중복 배정 {duplicateInstructors.size}건 감지
          </span>
        )}
      </div>

      {variant === 'A' ? (
        <AssignmentMatrixView courseId={selectedCourseId} />
      ) : (
        <AssignmentCardView courseId={selectedCourseId} />
      )}
    </div>
  )
}
