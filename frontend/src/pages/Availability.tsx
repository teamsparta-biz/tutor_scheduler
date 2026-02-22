import { useState, useMemo } from 'react'
import { mockInstructors, mockAvailability, mockAssignments, mockCourseDates, mockCourses } from '../mocks/data'
import type { InstructorAvailability } from '../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface CalendarDay {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const days: CalendarDay[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    days.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: true })
  }
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1)
    days.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false })
  }
  return days
}

const statusLabel: Record<InstructorAvailability['status'], string> = {
  available: '가능',
  unavailable: '불가',
  pending: '미정',
}

const statusColor: Record<InstructorAvailability['status'], { bg: string; text: string }> = {
  available: { bg: 'bg-green-50', text: 'text-green-700' },
  unavailable: { bg: 'bg-red-50', text: 'text-red-700' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
}

const activeInstructors = mockInstructors.filter((i) => i.is_active)

// 강사+날짜 → 배정 여부 빠른 조회
function isAssigned(instructorId: string, date: string) {
  return mockAssignments.some((a) => a.instructor_id === instructorId && a.date === date)
}

// ───────────────────────────────────────
// 탭 1: 강사용 가용성 등록 캘린더
// ───────────────────────────────────────
function RegistrationView() {
  const [selectedInstructor, setSelectedInstructor] = useState(activeInstructors[0]?.id ?? '')
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1)
  const [localAvail, setLocalAvail] = useState<Record<string, InstructorAvailability['status']>>(() => {
    const map: Record<string, InstructorAvailability['status']> = {}
    for (const av of mockAvailability) {
      if (av.instructor_id === activeInstructors[0]?.id) {
        map[av.date] = av.status
      }
    }
    return map
  })

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  function handleInstructorChange(id: string) {
    setSelectedInstructor(id)
    const map: Record<string, InstructorAvailability['status']> = {}
    for (const av of mockAvailability) {
      if (av.instructor_id === id) map[av.date] = av.status
    }
    setLocalAvail(map)
  }

  function cycleStatus(dateStr: string) {
    // 배정된 날짜는 변경 불가
    if (isAssigned(selectedInstructor, dateStr)) return
    setLocalAvail((prev) => {
      const current = prev[dateStr]
      const next: InstructorAvailability['status'] =
        current === 'available' ? 'unavailable'
          : current === 'unavailable' ? 'pending'
            : current === 'pending' ? 'available'
              : 'available'
      return { ...prev, [dateStr]: next }
    })
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <select
          value={selectedInstructor}
          onChange={(e) => handleInstructorChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {activeInstructors.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> 가능</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> 불가</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> 미정</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> 배정됨</span>
          <span className="text-gray-400 ml-2">날짜 클릭으로 상태 변경 (배정된 날짜 제외)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11) } else setCurrentMonth(currentMonth - 1) }} className="p-1.5 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800 min-w-32 text-center">{monthLabel}</h3>
        <button onClick={() => { if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0) } else setCurrentMonth(currentMonth + 1) }} className="p-1.5 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((wd, i) => (
            <div key={wd} className={`px-2 py-2 text-center text-sm font-medium ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}>{wd}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
            {week.map((day) => {
              const assigned = isAssigned(selectedInstructor, day.dateStr)
              const avail = assigned ? null : localAvail[day.dateStr] ?? null
              const sc = avail ? statusColor[avail] : null
              const dow = day.date.getDay()
              const cellBg = assigned ? 'bg-blue-50' : sc ? sc.bg : 'hover:bg-gray-50'

              return (
                <button
                  key={day.dateStr}
                  onClick={() => day.isCurrentMonth && cycleStatus(day.dateStr)}
                  className={`min-h-16 p-2 border-r border-gray-100 last:border-r-0 transition text-left ${
                    assigned ? 'cursor-default' : 'cursor-pointer'
                  } ${day.isCurrentMonth ? '' : 'opacity-30'} ${cellBg}`}
                >
                  <div className={`text-sm font-medium ${
                    dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="mt-1">
                    {assigned ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">배정됨</span>
                    ) : avail ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${sc!.bg} ${sc!.text} border`}>
                        {statusLabel[avail]}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────
// 탭 2: 관리자용 가용성 현황 — 날짜 선택 → 강사 목록
// ───────────────────────────────────────
function AdminView() {
  const [selectedDate, setSelectedDate] = useState('2026-02-18')
  const dates = [...new Set(mockAvailability.map((a) => a.date))].sort()

  const instructorsForDate = activeInstructors.map((inst) => {
    const assigned = isAssigned(inst.id, selectedDate)
    const av = mockAvailability.find((a) => a.instructor_id === inst.id && a.date === selectedDate)
    const assignments = mockAssignments.filter((a) => a.instructor_id === inst.id && a.date === selectedDate)
    const assignedCourses = assignments.map((a) => {
      const cd = mockCourseDates.find((c) => c.id === a.course_date_id)
      return cd ? mockCourses.find((c) => c.id === cd.course_id)?.title ?? '' : ''
    })
    // 배정 있으면 상태를 "배정됨"으로 덮어씀
    const effectiveStatus: InstructorAvailability['status'] | 'assigned' | null =
      assigned ? 'assigned' : av?.status ?? null
    return { ...inst, effectiveStatus, assignedCourses }
  })

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">날짜 선택:</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {dates.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">강사</th>
              <th className="px-4 py-3 font-medium">전문분야</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">배정 교육</th>
            </tr>
          </thead>
          <tbody>
            {instructorsForDate.map((inst) => {
              const es = inst.effectiveStatus
              const availStatus = es !== 'assigned' && es !== null ? es : null
              const sc = availStatus ? statusColor[availStatus] : null
              return (
                <tr key={inst.id} className={`border-b border-gray-100 ${es === 'assigned' ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{inst.name}</td>
                  <td className="px-4 py-3 text-gray-600">{inst.specialty}</td>
                  <td className="px-4 py-3">
                    {es === 'assigned' ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">배정됨</span>
                    ) : availStatus ? (
                      <span className={`px-2 py-0.5 rounded text-xs ${sc!.bg} ${sc!.text}`}>
                        {statusLabel[availStatus]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">미등록</span>
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
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ───────────────────────────────────────
// 메인 컴포넌트
// ───────────────────────────────────────
export default function Availability() {
  const [mainTab, setMainTab] = useState<'register' | 'admin'>('admin')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 가용성</h2>
        <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
          <button
            onClick={() => setMainTab('register')}
            className={`px-4 py-1.5 text-sm rounded-md cursor-pointer ${
              mainTab === 'register' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            일정 등록
          </button>
          <button
            onClick={() => setMainTab('admin')}
            className={`px-4 py-1.5 text-sm rounded-md cursor-pointer ${
              mainTab === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            가용성 현황
          </button>
        </div>
      </div>

      {mainTab === 'register' ? <RegistrationView /> : <AdminView />}
    </div>
  )
}
