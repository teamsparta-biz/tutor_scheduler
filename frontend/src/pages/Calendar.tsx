import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCalendar } from '../api/calendar'
import type { CalendarEvent } from '../api/calendar'
import { listInstructors } from '../api/instructors'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 교육일 단위로 묶은 데이터
interface GroupedCourseDay {
  courseId: string
  courseTitle: string
  mainTutors: { id: string; name: string; className: string }[]
  techTutors: { id: string; name: string }[]
  hasMainTutor: boolean // 주강사 배정 여부
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

export default function Calendar() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateStr(new Date()))
  const [filterInstructor, setFilterInstructor] = useState('all')

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // 캘린더 범위 계산
  const startDate = days[0].dateStr
  const endDate = days[days.length - 1].dateStr

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => getCalendar(startDate, endDate),
  })

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => listInstructors(),
  })

  const events = calendarData?.events ?? []

  // 날짜별 → 교육별 그룹화
  const groupedByDate = useMemo(() => {
    const dateMap = new Map<string, Map<string, CalendarEvent[]>>()
    for (const ev of events) {
      const dateStr = String(ev.date)
      if (!dateMap.has(dateStr)) dateMap.set(dateStr, new Map())
      const courseMap = dateMap.get(dateStr)!
      const key = ev.course_id
      if (!courseMap.has(key)) courseMap.set(key, [])
      courseMap.get(key)!.push(ev)
    }
    // 교육 그룹으로 변환
    const result = new Map<string, GroupedCourseDay[]>()
    for (const [dateStr, courseMap] of dateMap) {
      const groups: GroupedCourseDay[] = []
      for (const [courseId, evts] of courseMap) {
        const mainTutors: GroupedCourseDay['mainTutors'] = []
        const techTutors: GroupedCourseDay['techTutors'] = []
        for (const ev of evts) {
          if (ev.class_name === '기술지원') {
            techTutors.push({ id: ev.instructor_id, name: ev.instructor_name })
          } else {
            mainTutors.push({ id: ev.instructor_id, name: ev.instructor_name, className: ev.class_name ?? '' })
          }
        }
        groups.push({
          courseId,
          courseTitle: evts[0].course_title,
          mainTutors,
          techTutors,
          hasMainTutor: mainTutors.length > 0,
        })
      }
      // 배정 미완료(주강사 없음)가 위로 오도록 정렬
      groups.sort((a, b) => (a.hasMainTutor === b.hasMainTutor ? 0 : a.hasMainTutor ? 1 : -1))
      result.set(dateStr, groups)
    }
    return result
  }, [events])

  function getGroupsForDate(dateStr: string): GroupedCourseDay[] {
    const all = groupedByDate.get(dateStr) ?? []
    if (filterInstructor === 'all') return all
    return all.filter((g) =>
      g.mainTutors.some((t) => t.id === filterInstructor) ||
      g.techTutors.some((t) => t.id === filterInstructor)
    )
  }

  // 날짜별 이벤트 존재 여부 + 미배정 존재 여부 (미니 캘린더 dot 표시용)
  function dateHasEvents(dateStr: string): { has: boolean; hasUnassigned: boolean } {
    const groups = getGroupsForDate(dateStr)
    if (groups.length === 0) return { has: false, hasUnassigned: false }
    return { has: true, hasUnassigned: groups.some((g) => !g.hasMainTutor) }
  }

  const selectedGroups = selectedDate ? getGroupsForDate(selectedDate) : []

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
          {instructors.filter((i) => i.is_active).map((i) => (
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
                const { has, hasUnassigned } = dateHasEvents(day.dateStr)
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
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${hasUnassigned ? 'bg-orange-500' : 'bg-green-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {/* 범례 */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> 주강사 배정됨</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 배정 필요</span>
          </div>
        </div>

        {/* 상세 패널 */}
        <div className="flex-1 bg-white rounded-lg shadow p-5">
          {selectedDate ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedDate} 일정</h3>

              {selectedGroups.length > 0 ? (
                <div className="space-y-3">
                  {selectedGroups.map((group) => (
                    <div
                      key={group.courseId}
                      className={`p-4 rounded-lg border ${
                        group.hasMainTutor
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-orange-300 bg-orange-50/50'
                      }`}
                    >
                      {/* 교육명 + 배정 상태 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full ${group.hasMainTutor ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className="font-medium text-gray-800">{group.courseTitle}</span>
                        {!group.hasMainTutor && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">배정 필요</span>
                        )}
                      </div>

                      {/* 주강사 */}
                      <div className="flex items-start gap-2 text-sm mb-1.5">
                        <span className="text-gray-500 w-16 flex-shrink-0">주강사</span>
                        {group.mainTutors.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {group.mainTutors.map((t) => (
                              <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-orange-600 font-medium text-xs px-2 py-0.5 rounded bg-orange-100">미배정</span>
                        )}
                      </div>

                      {/* 기술 튜터 */}
                      {group.techTutors.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-gray-500 w-16 flex-shrink-0">기술지원</span>
                          <div className="flex flex-wrap gap-1.5">
                            {group.techTutors.map((t) => (
                              <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                                {t.name}
                              </span>
                            ))}
                          </div>
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
