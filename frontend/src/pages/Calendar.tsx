import { useState, useMemo } from 'react'
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
    return {
      id: a.id,
      courseTitle: course?.title ?? '-',
      courseId: course?.id ?? '',
      instructorName: instructor?.name ?? '-',
      className: a.class_name,
      colors,
    }
  })
}

function FullGridView({
  days,
  viewMode,
  selectedDate,
  onSelectDate,
  filterInstructor,
  currentYear,
  currentMonth,
}: {
  days: CalendarDay[]
  viewMode: 'month' | 'week'
  selectedDate: string | null
  onSelectDate: (d: string) => void
  filterInstructor: string
  currentYear: number
  currentMonth: number
}) {
  const displayDays = useMemo(() => {
    if (viewMode === 'month') return days
    // week view: show the week containing the selected date or current week
    const target = selectedDate ?? formatDateStr(new Date(currentYear, currentMonth, 18))
    const idx = days.findIndex((d) => d.dateStr === target)
    const weekStart = idx >= 0 ? Math.floor(idx / 7) * 7 : 0
    return days.slice(weekStart, weekStart + 7)
  }, [days, viewMode, selectedDate, currentYear, currentMonth])

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < displayDays.length; i += 7) {
    weeks.push(displayDays.slice(i, i + 7))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((wd, i) => (
          <div key={wd} className={`px-2 py-2 text-center text-sm font-medium ${
            i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
          }`}>
            {wd}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
          {week.map((day) => {
            const events = getEventsForDate(day.dateStr, filterInstructor)
            const isSelected = selectedDate === day.dateStr
            const dow = day.date.getDay()
            return (
              <div
                key={day.dateStr}
                onClick={() => onSelectDate(day.dateStr)}
                className={`min-h-24 p-1.5 border-r border-gray-100 last:border-r-0 cursor-pointer transition ${
                  day.isCurrentMonth ? '' : 'opacity-40'
                } ${isSelected ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-gray-50'}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, viewMode === 'month' ? 3 : 6).map((ev) => (
                    <div key={ev.id} className={`px-1 py-0.5 rounded text-xs truncate ${ev.colors.bg} ${ev.colors.text}`}>
                      {ev.instructorName} · {ev.className}
                    </div>
                  ))}
                  {viewMode === 'month' && events.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">+{events.length - 3}건</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SplitView({
  days,
  selectedDate,
  onSelectDate,
  filterInstructor,
}: {
  days: CalendarDay[]
  selectedDate: string | null
  onSelectDate: (d: string) => void
  filterInstructor: string
}) {
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const events = selectedDate ? getEventsForDate(selectedDate, filterInstructor) : []

  return (
    <div className="flex gap-6">
      {/* Mini calendar */}
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
                  onClick={() => onSelectDate(day.dateStr)}
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

      {/* Detail panel */}
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
  )
}

export default function Calendar() {
  const [variant, setVariant] = useState<'A' | 'B'>('A')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1) // 0-indexed: 1 = February
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-02-18')
  const [filterInstructor, setFilterInstructor] = useState('all')

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])

  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">캘린더</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">레이아웃:</span>
          <ABToggle variant={variant} onChange={setVariant} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-3">
          {variant === 'A' && (
            <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                주간
              </button>
            </div>
          )}

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
      </div>

      {variant === 'A' ? (
        <FullGridView
          days={days}
          viewMode={viewMode}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          filterInstructor={filterInstructor}
          currentYear={currentYear}
          currentMonth={currentMonth}
        />
      ) : (
        <SplitView
          days={days}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          filterInstructor={filterInstructor}
        />
      )}
    </div>
  )
}
