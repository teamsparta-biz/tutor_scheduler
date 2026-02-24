import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listInstructors } from '../api/instructors'
import { listCourses, getCourse } from '../api/courses'
import { getCalendar } from '../api/calendar'
import { listAvailability } from '../api/availability'
import type { Instructor, Course } from '../types'

type RoleFilter = 'all' | 'main' | 'tech'
const isTechTutor = (inst: Instructor) => inst.specialty === 'Technical Tutor'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = []
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

// 검색 가능한 교육 선택 콤보박스
function CourseCombobox({ courses, value, onChange }: {
  courses: Course[]
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selected = courses.find((c) => c.id === value)

  const filtered = useMemo(() => {
    if (!query) return courses
    const q = query.toLowerCase()
    return courses.filter((c) => c.title.toLowerCase().includes(q))
  }, [courses, query])

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        <input
          type="text"
          value={open ? query : (selected?.title ?? '')}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); if (selected) setQuery('') }}
          placeholder="교육명 검색..."
          className="flex-1 px-3 py-2 text-sm focus:outline-none min-w-0"
        />
        {value && (
          <button onClick={handleClear} className="px-2 text-gray-400 hover:text-gray-600 cursor-pointer text-sm">x</button>
        )}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">검색 결과 없음</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${
                  c.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="truncate">{c.title}</div>
                {c.lecture_start && (
                  <div className="text-xs text-gray-400">{c.lecture_start} ~ {c.lecture_end ?? ''}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

type DayStatus = 'available' | 'assigned' | 'unavailable' | 'pending'

export default function Availability() {
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('main')
  const [minDays, setMinDays] = useState(0) // 0 = 전체 보기
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  const days = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth])
  const weeks: (typeof days)[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // 데이터 조회
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => listInstructors(true),
  })

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses,
  })

  // 교육 선택 시 일정 가져오기
  const { data: courseDetail } = useQuery({
    queryKey: ['course', selectedCourseId],
    queryFn: () => getCourse(selectedCourseId),
    enabled: !!selectedCourseId,
  })

  // 선택된 날짜 범위로 캘린더 + 가용성 조회
  const sortedDates = useMemo(() => [...selectedDates].sort(), [selectedDates])
  const rangeStart = sortedDates[0] ?? ''
  const rangeEnd = sortedDates[sortedDates.length - 1] ?? ''

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', rangeStart, rangeEnd],
    queryFn: () => getCalendar(rangeStart, rangeEnd),
    enabled: sortedDates.length > 0,
  })

  const { data: availData = [] } = useQuery({
    queryKey: ['availability-range', rangeStart, rangeEnd],
    queryFn: () => listAvailability({ start_date: rangeStart, end_date: rangeEnd }),
    enabled: sortedDates.length > 0,
  })

  const events = calendarData?.events ?? []

  // 날짜 토글
  function toggleDate(dateStr: string) {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort(),
    )
  }

  function removeDate(dateStr: string) {
    setSelectedDates((prev) => prev.filter((d) => d !== dateStr))
  }

  function clearDates() {
    setSelectedDates([])
    setSelectedCourseId('')
  }

  // 교육에서 날짜 가져오기
  function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId)
    if (!courseId) return
  }

  // courseDetail이 로드되면 날짜 자동 선택
  useMemo(() => {
    if (courseDetail?.dates && selectedCourseId) {
      const dates = courseDetail.dates.map((d) => d.date).sort()
      setSelectedDates(dates)
      // 캘린더를 해당 월로 이동
      if (dates[0]) {
        const [y, m] = dates[0].split('-').map(Number)
        setCalYear(y)
        setCalMonth(m - 1)
      }
    }
  }, [courseDetail, selectedCourseId])

  // 미니 캘린더 월 이동
  function prevMonth() {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) }
    else setCalMonth(calMonth - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) }
    else setCalMonth(calMonth + 1)
  }

  // 강사별 날짜별 상태 매트릭스
  const instructorMatrix = useMemo(() => {
    const filtered = roleFilter === 'main'
      ? instructors.filter((i) => !isTechTutor(i))
      : roleFilter === 'tech'
        ? instructors.filter((i) => isTechTutor(i))
        : instructors

    if (sortedDates.length === 0) return []

    return filtered.map((inst) => {
      const dateStatuses: Record<string, DayStatus> = {}
      let availCount = 0
      let explicitAvailCount = 0

      for (const dateStr of sortedDates) {
        const hasAssignment = events.some(
          (e) => e.instructor_id === inst.id && String(e.date) === dateStr,
        )
        const availRecord = availData.find(
          (a) => a.instructor_id === inst.id && String(a.date) === dateStr,
        )

        let status: DayStatus = 'pending'
        if (hasAssignment) status = 'assigned'
        else if (availRecord?.status === 'available') status = 'available'
        else if (availRecord?.status === 'unavailable') status = 'unavailable'

        dateStatuses[dateStr] = status
        if (status !== 'assigned' && status !== 'unavailable') availCount++
        if (status === 'available') explicitAvailCount++
      }

      return { ...inst, dateStatuses, availCount, explicitAvailCount }
    })
      .filter((inst) => minDays === 0 || inst.availCount >= minDays)
      .sort((a, b) => b.availCount - a.availCount || b.explicitAvailCount - a.explicitAvailCount)
  }, [instructors, roleFilter, sortedDates, events, availData, minDays])

  const mainCount = instructors.filter((i) => !isTechTutor(i)).length
  const techCount = instructors.filter((i) => isTechTutor(i)).length

  const statusIcon = (s: DayStatus) => {
    switch (s) {
      case 'available': return <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
      case 'assigned': return <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
      case 'unavailable': return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
      default: return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
    }
  }

  const statusLabel = (s: DayStatus) => {
    switch (s) {
      case 'available': return '가능'
      case 'assigned': return '배정'
      case 'unavailable': return '불가'
      default: return '미정'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 가용성</h2>
        <span className="text-sm text-gray-400">날짜를 복수 선택하여 가용 강사를 검색합니다</span>
      </div>

      {/* 역할 탭 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
          {([['main', `주강사 (${mainCount})`], ['tech', `기술 튜터 (${techCount})`], ['all', `전체 (${instructors.length})`]] as const).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f as RoleFilter)}
              className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                roleFilter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 mb-6">
        {/* 왼쪽: 미니 캘린더 + 교육 선택 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 교육에서 가져오기 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">교육에서 날짜 가져오기</label>
            <CourseCombobox courses={courses} value={selectedCourseId} onChange={handleCourseSelect} />
          </div>

          {/* 미니 캘린더 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-semibold text-gray-800">{calYear}년 {calMonth + 1}월</span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((wd, i) => (
                <div key={wd} className={`text-center text-xs font-medium py-1 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}>{wd}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day) => {
                  const isSelected = selectedDates.includes(day.dateStr)
                  const dow = day.date.getDay()
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => toggleDate(day.dateStr)}
                      className={`relative py-1.5 text-center text-sm cursor-pointer rounded transition ${
                        day.isCurrentMonth ? '' : 'opacity-30'
                      } ${
                        isSelected
                          ? 'bg-blue-600 text-white font-semibold'
                          : dow === 0
                            ? 'text-red-500 hover:bg-red-50'
                            : dow === 6
                              ? 'text-blue-500 hover:bg-blue-50'
                              : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day.date.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-2 text-center">클릭하여 날짜를 선택/해제</p>
          </div>

          {/* 선택된 날짜 칩 */}
          {sortedDates.length > 0 && (
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">선택된 날짜 ({sortedDates.length}일)</span>
                <button onClick={clearDates} className="text-xs text-red-500 hover:text-red-700 cursor-pointer">전체 해제</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sortedDates.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                  >
                    {shortDate(d)}
                    <button onClick={() => removeDate(d)} className="text-blue-400 hover:text-blue-700 cursor-pointer">x</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 가용 기준 필터 */}
          {sortedDates.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">가용 기준</label>
              <select
                value={minDays}
                onChange={(e) => setMinDays(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>전체 보기</option>
                {Array.from({ length: sortedDates.length }, (_, i) => sortedDates.length - i).map((n) => (
                  <option key={n} value={n}>{n}일 {n === sortedDates.length ? '전부' : '이상'} 가능</option>
                ))}
              </select>
            </div>
          )}

          {/* 범례 */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 가능</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 배정됨</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 불가</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> 미정</span>
          </div>
        </div>

        {/* 오른쪽: 강사 매트릭스 테이블 */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          {sortedDates.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              캘린더에서 날짜를 선택하거나, 교육을 선택하면 가용성이 표시됩니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium sticky left-0 bg-gray-50 z-10">강사</th>
                    <th className="px-3 py-3 font-medium text-center">가용</th>
                    {sortedDates.map((d) => {
                      const dow = new Date(d + 'T00:00:00').getDay()
                      const dayLabel = WEEKDAYS[dow]
                      return (
                        <th key={d} className="px-3 py-3 font-medium text-center whitespace-nowrap">
                          <div className="text-xs">{shortDate(d)}</div>
                          <div className={`text-[10px] ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{dayLabel}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {instructorMatrix.map((inst) => {
                    const ratio = `${inst.availCount}/${sortedDates.length}`
                    const allAvail = inst.availCount === sortedDates.length
                    return (
                      <tr
                        key={inst.id}
                        className={`border-b border-gray-100 ${
                          allAvail ? 'bg-green-50/50' : ''
                        } hover:bg-gray-50`}
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-800 sticky left-0 bg-inherit whitespace-nowrap">
                          {inst.name}
                          {isTechTutor(inst) && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">기술</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center justify-center w-10 py-0.5 rounded text-xs font-semibold ${
                            allAvail
                              ? 'bg-green-100 text-green-700'
                              : inst.availCount === 0
                                ? 'bg-red-100 text-red-600'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ratio}
                          </span>
                        </td>
                        {sortedDates.map((d) => {
                          const s = inst.dateStatuses[d]
                          return (
                            <td key={d} className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {statusIcon(s)}
                                <span className={`text-xs ${
                                  s === 'available' ? 'text-green-600'
                                    : s === 'assigned' ? 'text-blue-600'
                                      : s === 'unavailable' ? 'text-red-500'
                                        : 'text-gray-400'
                                }`}>{statusLabel(s)}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {instructorMatrix.length === 0 && (
                    <tr>
                      <td colSpan={2 + sortedDates.length} className="px-4 py-8 text-center text-gray-400">
                        {minDays > 0 ? `${minDays}일 이상 가능한 강사가 없습니다` : '해당 역할의 강사가 없습니다'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                {instructorMatrix.length}명 표시 / 가용일 수 내림차순 정렬
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
