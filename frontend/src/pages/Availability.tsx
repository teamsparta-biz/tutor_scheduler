import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listInstructors } from '../api/instructors'
import { getCalendar } from '../api/calendar'
import { listAvailability } from '../api/availability'
import type { Instructor } from '../types'

type RoleFilter = 'all' | 'main' | 'tech'
const isTechTutor = (inst: Instructor) => inst.specialty === 'Technical Tutor'

const STATUS_ORDER: Record<string, number> = {
  available: 0,
  pending: 1,
  assigned: 2,
  unavailable: 3,
}

function RoleFilterButtons({ instructors, value, onChange }: { instructors: Instructor[]; value: RoleFilter; onChange: (v: RoleFilter) => void }) {
  const mainCount = instructors.filter((i) => !isTechTutor(i)).length
  const techCount = instructors.filter((i) => isTechTutor(i)).length
  const options: [RoleFilter, string][] = [
    ['main', `주강사 (${mainCount})`],
    ['tech', `기술 튜터 (${techCount})`],
    ['all', `전체 (${instructors.length})`],
  ]
  return (
    <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
      {options.map(([f, label]) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
            value === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Availability() {
  const [selectedDate, setSelectedDate] = useState(formatDateStr(new Date()))
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('main')

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => listInstructors(true),
  })

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', selectedDate, selectedDate],
    queryFn: () => getCalendar(selectedDate, selectedDate),
    enabled: !!selectedDate,
  })

  const { data: availData = [] } = useQuery({
    queryKey: ['availability-range', selectedDate, selectedDate],
    queryFn: () => listAvailability({ start_date: selectedDate, end_date: selectedDate }),
    enabled: !!selectedDate,
  })

  const events = calendarData?.events ?? []

  const instructorsForDate = useMemo(() => {
    const filtered = roleFilter === 'main'
      ? instructors.filter((i) => !isTechTutor(i))
      : roleFilter === 'tech'
        ? instructors.filter((i) => isTechTutor(i))
        : instructors

    return filtered.map((inst) => {
      const instEvents = events.filter((e) => e.instructor_id === inst.id)
      const assigned = instEvents.length > 0
      const availRecord = availData.find((a) => a.instructor_id === inst.id)
      const assignedCourses = [...new Set(instEvents.map((e) => e.course_title))]

      const effectiveStatus: 'assigned' | 'available' | 'pending' | 'unavailable' =
        assigned ? 'assigned'
        : availRecord?.status === 'available' ? 'available'
        : availRecord?.status === 'unavailable' ? 'unavailable'
        : 'pending'

      return { ...inst, effectiveStatus, assignedCourses }
    }).sort((a, b) => (STATUS_ORDER[a.effectiveStatus] ?? 9) - (STATUS_ORDER[b.effectiveStatus] ?? 9))
  }, [instructors, roleFilter, events, availData])

  const counts = useMemo(() => {
    const c = { assigned: 0, available: 0, pending: 0, unavailable: 0 }
    for (const inst of instructorsForDate) c[inst.effectiveStatus]++
    return c
  }, [instructorsForDate])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 가용성</h2>
        <span className="text-sm text-gray-400">가용성 등록은 강사 포털에서 가능합니다</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <RoleFilterButtons instructors={instructors} value={roleFilter} onChange={setRoleFilter} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-gray-700">날짜 선택:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3 text-xs text-gray-500 ml-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 배정됨 {counts.assigned}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 가능 {counts.available}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> 미정 {counts.pending}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 불가 {counts.unavailable}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">강사</th>
              <th className="px-4 py-3 font-medium">역할</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">배정 교육</th>
            </tr>
          </thead>
          <tbody>
            {instructorsForDate.map((inst) => {
              const es = inst.effectiveStatus
              const rowBg = es === 'assigned' ? 'bg-blue-50/50'
                : es === 'unavailable' ? 'bg-red-50/50'
                : es === 'available' ? 'bg-green-50/50'
                : 'hover:bg-gray-50'
              return (
                <tr key={inst.id} className={`border-b border-gray-100 ${rowBg}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{inst.name}</td>
                  <td className="px-4 py-3">
                    {isTechTutor(inst) ? (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">기술 튜터</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">주강사</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {es === 'assigned' ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">배정됨</span>
                    ) : es === 'available' ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">가능</span>
                    ) : es === 'unavailable' ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">불가</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">미정</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inst.assignedCourses.length > 0 ? (
                      <span className="text-sm text-gray-800">{inst.assignedCourses.join(', ')}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {instructorsForDate.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">해당 역할의 강사가 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
