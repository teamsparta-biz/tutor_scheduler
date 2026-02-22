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

const statusColor: Record<InstructorAvailability['status'], { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  unavailable: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
}

const activeInstructors = mockInstructors.filter((i) => i.is_active)

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

  // 해당 강사의 배정 날짜들
  const assignedDates = new Set(
    mockAssignments.filter((a) => a.instructor_id === selectedInstructor).map((a) => a.date)
  )

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
          <span className="text-gray-400 ml-2">날짜 클릭으로 상태 변경</span>
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
              const avail = localAvail[day.dateStr]
              const isAssigned = assignedDates.has(day.dateStr)
              const sc = avail ? statusColor[avail] : null
              const dow = day.date.getDay()

              return (
                <button
                  key={day.dateStr}
                  onClick={() => day.isCurrentMonth && cycleStatus(day.dateStr)}
                  className={`min-h-16 p-2 border-r border-gray-100 last:border-r-0 cursor-pointer transition text-left ${
                    day.isCurrentMonth ? '' : 'opacity-30'
                  } ${sc ? sc.bg : 'hover:bg-gray-50'}`}
                >
                  <div className={`text-sm font-medium ${
                    dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {avail && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${sc!.bg} ${sc!.text} border`}>
                        {statusLabel[avail]}
                      </span>
                    )}
                    {isAssigned && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                        배정
                      </span>
                    )}
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
// 탭 2: 관리자용 가용성 현황 (A/B/C 시안)
// ───────────────────────────────────────

// A안: 날짜 선택 → 강사 목록
function AdminViewA() {
  const [selectedDate, setSelectedDate] = useState('2026-02-18')
  const dates = [...new Set(mockAvailability.map((a) => a.date))].sort()

  const instructorsForDate = activeInstructors.map((inst) => {
    const av = mockAvailability.find((a) => a.instructor_id === inst.id && a.date === selectedDate)
    const assignments = mockAssignments.filter((a) => a.instructor_id === inst.id && a.date === selectedDate)
    const assignedCourses = assignments.map((a) => {
      const cd = mockCourseDates.find((c) => c.id === a.course_date_id)
      return cd ? mockCourses.find((c) => c.id === cd.course_id)?.title ?? '' : ''
    })
    return { ...inst, status: av?.status ?? null, assignedCourses }
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
              <th className="px-4 py-3 font-medium">가용 상태</th>
              <th className="px-4 py-3 font-medium">배정 현황</th>
            </tr>
          </thead>
          <tbody>
            {instructorsForDate.map((inst) => {
              const sc = inst.status ? statusColor[inst.status] : null
              return (
                <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{inst.name}</td>
                  <td className="px-4 py-3 text-gray-600">{inst.specialty}</td>
                  <td className="px-4 py-3">
                    {inst.status ? (
                      <span className={`px-2 py-0.5 rounded text-xs ${sc!.bg} ${sc!.text}`}>
                        {statusLabel[inst.status]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">미등록</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inst.assignedCourses.length > 0 ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {inst.assignedCourses.join(', ')}
                      </span>
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

// B안: 날짜 × 강사 매트릭스
function AdminViewB() {
  const dates = [...new Set(mockAvailability.map((a) => a.date))].sort()

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-gray-600 font-medium sticky left-0 bg-gray-50 z-10">날짜</th>
            {activeInstructors.map((inst) => (
              <th key={inst.id} className="border border-gray-200 bg-gray-50 px-3 py-2 text-center text-gray-600 font-medium min-w-20">
                <div>{inst.name}</div>
                <div className="text-xs text-gray-400 font-normal">{inst.specialty}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => (
            <tr key={date}>
              <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800 sticky left-0 bg-white z-10">{date}</td>
              {activeInstructors.map((inst) => {
                const av = mockAvailability.find((a) => a.instructor_id === inst.id && a.date === date)
                const isAssigned = mockAssignments.some((a) => a.instructor_id === inst.id && a.date === date)
                const sc = av ? statusColor[av.status] : null

                return (
                  <td key={inst.id} className={`border border-gray-200 px-3 py-2 text-center ${sc ? sc.bg : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      {av ? (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${sc!.text}`}>
                          {statusLabel[av.status]}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                      {isAssigned && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">배정</span>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// C안: 매트릭스 + 날짜 클릭 시 상세
function AdminViewC() {
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-02-18')
  const dates = [...new Set(mockAvailability.map((a) => a.date))].sort()

  const detailInstructors = selectedDate ? activeInstructors.map((inst) => {
    const av = mockAvailability.find((a) => a.instructor_id === inst.id && a.date === selectedDate)
    const assignments = mockAssignments.filter((a) => a.instructor_id === inst.id && a.date === selectedDate)
    const assignedCourses = assignments.map((a) => {
      const cd = mockCourseDates.find((c) => c.id === a.course_date_id)
      return cd ? mockCourses.find((c) => c.id === cd.course_id)?.title ?? '' : ''
    })
    return { ...inst, status: av?.status ?? null, assignedCourses }
  }) : []

  return (
    <div className="space-y-4">
      {/* 매트릭스 (간소) */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-gray-600 font-medium">날짜</th>
              {activeInstructors.map((inst) => (
                <th key={inst.id} className="border border-gray-200 bg-gray-50 px-2 py-2 text-center text-gray-600 font-medium text-xs">{inst.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => (
              <tr
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`cursor-pointer transition ${selectedDate === date ? 'ring-2 ring-blue-400' : 'hover:bg-gray-50'}`}
              >
                <td className="border border-gray-200 px-3 py-1.5 font-medium text-gray-800 text-xs">{date}</td>
                {activeInstructors.map((inst) => {
                  const av = mockAvailability.find((a) => a.instructor_id === inst.id && a.date === date)
                  const sc = av ? statusColor[av.status] : null
                  return (
                    <td key={inst.id} className={`border border-gray-200 text-center ${sc ? sc.bg : ''}`}>
                      <span className={`w-3 h-3 rounded-full inline-block ${sc ? sc.dot : 'bg-gray-200'}`} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상세 패널 */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow p-5">
          <h4 className="font-semibold text-gray-800 mb-3">{selectedDate} 상세</h4>
          <div className="space-y-2">
            {detailInstructors.map((inst) => {
              const sc = inst.status ? statusColor[inst.status] : null
              return (
                <div key={inst.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  inst.status === 'available' ? 'border-green-200 bg-green-50' :
                  inst.status === 'unavailable' ? 'border-red-200 bg-red-50' :
                  inst.status === 'pending' ? 'border-amber-200 bg-amber-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{inst.name}</span>
                    <span className="text-xs text-gray-500">{inst.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inst.status ? (
                      <span className={`px-2 py-0.5 rounded text-xs ${sc!.bg} ${sc!.text} border`}>
                        {statusLabel[inst.status]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">미등록</span>
                    )}
                    {inst.assignedCourses.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {inst.assignedCourses.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────────────────────
// 메인 컴포넌트
// ───────────────────────────────────────
export default function Availability() {
  const [mainTab, setMainTab] = useState<'register' | 'admin'>('admin')
  const [adminView, setAdminView] = useState<'A' | 'B' | 'C'>('A')

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

      {mainTab === 'register' ? (
        <RegistrationView />
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-500">시안:</span>
            <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
              {(['A', 'B', 'C'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAdminView(v)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
                    adminView === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {v === 'A' ? 'A: 날짜→목록' : v === 'B' ? 'B: 매트릭스' : 'C: 매트릭스+상세'}
                </button>
              ))}
            </div>
          </div>
          {adminView === 'A' ? <AdminViewA /> : adminView === 'B' ? <AdminViewB /> : <AdminViewC />}
        </div>
      )}
    </div>
  )
}
