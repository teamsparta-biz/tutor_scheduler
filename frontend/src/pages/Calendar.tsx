import { useState, useMemo } from 'react'
import { mockCourses, mockCourseDates, mockAssignments, mockInstructors, mockCoursePMs } from '../mocks/data'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  '진행중': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '예정': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  '완료': { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
}

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

function getEventsForDate(dateStr: string, filterInstructor: string) {
  const assignments = mockAssignments.filter((a) => {
    if (a.date !== dateStr) return false
    if (filterInstructor !== 'all' && a.instructor_id !== filterInstructor) return false
    return true
  })
  return assignments.map((a) => {
    const cd = mockCourseDates.find((c) => c.id === a.course_date_id)
    const course = cd ? mockCourses.find((c) => c.id === cd.course_id) : null
    const instructor = mockInstructors.find((i) => i.id === a.instructor_id)
    const defaultColors = { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
    const colors = course?.status ? statusColors[course.status] ?? defaultColors : defaultColors
    const pms = course ? mockCoursePMs[course.id] ?? [] : []
    return {
      id: a.id,
      courseTitle: course?.title ?? '-',
      instructorName: instructor?.name ?? '-',
      className: a.class_name,
      colors,
      pms,
    }
  })
}

// 해당 날짜에 강사가 미배정인 교육 일정 조회 (완료 교육 제외)
function getUnassignedForDate(dateStr: string) {
  const courseDatesOnDay = mockCourseDates.filter((cd) => cd.date === dateStr)
  const unassigned: { courseDateId: string; courseTitle: string; courseStatus: string | null; dayNumber: number; pms: string[] }[] = []

  for (const cd of courseDatesOnDay) {
    const course = mockCourses.find((c) => c.id === cd.course_id)
    if (!course || course.status === '완료') continue
    const hasAssignment = mockAssignments.some((a) => a.course_date_id === cd.id)
    if (!hasAssignment) {
      unassigned.push({
        courseDateId: cd.id,
        courseTitle: course.title,
        courseStatus: course.status,
        dayNumber: cd.day_number,
        pms: mockCoursePMs[course.id] ?? [],
      })
    }
  }
  return unassigned
}

// 날짜에 이벤트가 있는지 (배정 or 미배정 포함)
function hasAnyEvent(dateStr: string, filterInstructor: string) {
  return getEventsForDate(dateStr, filterInstructor).length > 0 || getUnassignedForDate(dateStr).length > 0
}

export default function Calendar() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-02-19')
  const [filterInstructor, setFilterInstructor] = useState('all')

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const events = selectedDate ? getEventsForDate(selectedDate, filterInstructor) : []
  const unassigned = selectedDate ? getUnassignedForDate(selectedDate) : []

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11) }
    else setCurrentMonth(currentMonth - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0) }
    else setCurrentMonth(currentMonth + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">캘린더</h2>
        <select
          value={filterInstructor}
          onChange={(e) => setFilterInstructor(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">전체 강사</option>
          {mockInstructors.filter((i) => i.is_active).map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800 min-w-32 text-center">{monthLabel}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex gap-6">
        {/* 미니 캘린더 */}
        <div className="w-72 flex-shrink-0 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}>{wd}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const has = hasAnyEvent(day.dateStr, filterInstructor)
                const hasUnassigned = getUnassignedForDate(day.dateStr).length > 0
                const isSelected = selectedDate === day.dateStr
                const dow = day.date.getDay()
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`relative py-1.5 text-center text-sm cursor-pointer rounded transition ${
                      day.isCurrentMonth ? '' : 'opacity-30'
                    } ${isSelected ? 'bg-blue-600 text-white' : dow === 0 ? 'text-red-500 hover:bg-red-50' : dow === 6 ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {day.date.getDate()}
                    {has && !isSelected && (
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        hasUnassigned ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {/* 범례 */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 배정 완료</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 미배정 있음</span>
          </div>
        </div>

        {/* 상세 패널 */}
        <div className="flex-1 bg-white rounded-lg shadow p-5">
          {selectedDate ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedDate} 일정</h3>

              {/* 미배정 경고 */}
              {unassigned.length > 0 && (
                <div className="mb-4 space-y-2">
                  {unassigned.map((u) => {
                    const colors = u.courseStatus ? statusColors[u.courseStatus] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' } : { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
                    return (
                      <div key={u.courseDateId} className="p-4 rounded-lg border border-amber-300 bg-amber-50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                            <span className={`font-medium ${colors.text}`}>{u.courseTitle}</span>
                            <span className="text-xs text-gray-500">Day {u.dayNumber}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">미배정</span>
                        </div>
                        {u.pms.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">PM: {u.pms.join(', ')}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 배정된 일정 */}
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className={`p-4 rounded-lg border border-gray-200 ${ev.colors.bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${ev.colors.dot}`} />
                        <span className={`font-medium ${ev.colors.text}`}>{ev.courseTitle}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>강사: <strong className="text-gray-800">{ev.instructorName}</strong></span>
                        <span className="px-2 py-0.5 bg-white/60 rounded text-xs">{ev.className}</span>
                      </div>
                      {ev.pms.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">PM: {ev.pms.join(', ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : unassigned.length === 0 ? (
                <p className="text-gray-400 text-sm">이 날짜에 예정된 일정이 없습니다</p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              날짜를 선택하면 상세 일정이 표시됩니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
