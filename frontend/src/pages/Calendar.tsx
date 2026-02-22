import { useState, useMemo } from 'react'
import { mockCourses, mockCourseDates, mockAssignments, mockInstructors, mockCoursePMs } from '../mocks/data'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const courseColors: Record<string, { bg: string; text: string; dot: string }> = {
  'course-1': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'course-2': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'course-3': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
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
    const colors = course ? courseColors[course.id] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' } : { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
    const pms = course ? mockCoursePMs[course.id] ?? [] : []
    return {
      id: a.id,
      courseTitle: course?.title ?? '-',
      courseId: course?.id ?? '',
      instructorName: instructor?.name ?? '-',
      className: a.class_name,
      colors,
      pms,
    }
  })
}

export default function Calendar() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1) // 0-indexed: 1 = February
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-02-18')
  const [filterInstructor, setFilterInstructor] = useState('all')

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const events = selectedDate ? getEventsForDate(selectedDate, filterInstructor) : []

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

      {/* 월 이동 */}
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

      {/* 분할 뷰: 미니 캘린더 + 상세 */}
      <div className="flex gap-6">
        {/* 미니 캘린더 */}
        <div className="w-72 flex-shrink-0 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {wd}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const hasEvents = getEventsForDate(day.dateStr, filterInstructor).length > 0
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
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* 상세 패널 */}
        <div className="flex-1 bg-white rounded-lg shadow p-5">
          {selectedDate ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedDate} 일정</h3>
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
                        <div className="mt-2 text-xs text-gray-500">
                          PM: {ev.pms.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">이 날짜에 예정된 일정이 없습니다</p>
              )}
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
