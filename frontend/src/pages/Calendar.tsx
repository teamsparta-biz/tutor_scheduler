import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCalendar } from '../api/calendar'
import type { CalendarEvent } from '../api/calendar'
import { listInstructors } from '../api/instructors'
import { formatDateStr, getCalendarDays } from '../utils/date'
import type { CalendarDay } from '../utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 교육일 단위로 묶은 데이터
interface GroupedCourseDay {
  courseId: string
  courseTitle: string
  mainTutors: { id: string; name: string; className: string }[]
  techTutors: { id: string; name: string }[]
  hasMainTutor: boolean // 주강사 배정 여부
  notionPageId: string
  workbookUrl: string | null
  manager: string | null
  managerEmail: string | null
  salesRep: string | null
  salesRepEmail: string | null
}

export default function Calendar() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateStr(new Date()))
  const [filterInstructor, setFilterInstructor] = useState('all')
  const [filterManager, setFilterManager] = useState('all')
  const [filterSalesRep, setFilterSalesRep] = useState('all')

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

  const managerOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ev of events) {
      if (ev.manager) {
        for (const name of ev.manager.split(', ')) {
          const trimmed = name.trim()
          if (trimmed) set.add(trimmed)
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [events])

  const salesRepOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ev of events) {
      if (ev.sales_rep) {
        for (const name of ev.sales_rep.split(', ')) {
          const trimmed = name.trim()
          if (trimmed) set.add(trimmed)
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [events])

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
          notionPageId: evts[0].notion_page_id,
          workbookUrl: evts[0].workbook_full_url,
          manager: evts[0].manager,
          managerEmail: evts[0].manager_email,
          salesRep: evts[0].sales_rep,
          salesRepEmail: evts[0].sales_rep_email,
        })
      }
      // 배정 미완료(주강사 없음)가 위로 오도록 정렬
      groups.sort((a, b) => (a.hasMainTutor === b.hasMainTutor ? 0 : a.hasMainTutor ? 1 : -1))
      result.set(dateStr, groups)
    }
    return result
  }, [events])

  function getGroupsForDate(dateStr: string): GroupedCourseDay[] {
    let result = groupedByDate.get(dateStr) ?? []
    if (filterInstructor !== 'all') {
      result = result.filter((g) =>
        g.mainTutors.some((t) => t.id === filterInstructor) ||
        g.techTutors.some((t) => t.id === filterInstructor)
      )
    }
    if (filterManager !== 'all') {
      result = result.filter((g) => g.manager != null && g.manager.includes(filterManager))
    }
    if (filterSalesRep !== 'all') {
      result = result.filter((g) => g.salesRep != null && g.salesRep.includes(filterSalesRep))
    }
    return result
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
        <div className="flex items-center gap-2">
          <select
            value={filterManager}
            onChange={(e) => setFilterManager(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">매니저 전체</option>
            {managerOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterSalesRep}
            onChange={(e) => setFilterSalesRep(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">영업 전체</option>
            {salesRepOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
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
                      {/* 교육명 + 배정 상태 + Notion 바로가기 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full ${group.hasMainTutor ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className="font-medium text-gray-800">{group.courseTitle}</span>
                        {!group.hasMainTutor && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">배정 필요</span>
                        )}
                        <span className="flex-1" />
                        {group.notionPageId && (
                          <a
                            href={`https://notion.so/${group.notionPageId.replace(/-/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Notion 페이지"
                            className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 100 100" fill="currentColor"><path d="M6.6 12.3c4.3 3.5 5.9 3.3 14-2L81 3.6c3.3-2.3 1-5.9-5.3-4.3L21.1 10.2c-5.3 1.6-6.6 5-2.7 7.6l-2.7-1z"/><path d="M11.6 89.1V24.9c0-3.4 1.1-5 4.4-7.3L78.5 6c3.5-2.3 7.7-1.3 7.7 4.3v63c0 4.8-2.7 7-7.3 7.4L19.2 93c-4.8.7-7.6-1.6-7.6-5.5zm11.4-60.3c0-2.5.5-3.6 2-4.4l2.3-1.1c1.5-.7 3.3.3 3.3 2.3v55.3c0 2-1.2 3-3 2.7l-2.3-.5c-1.5-.4-2.3-1.8-2.3-3.5V28.8z"/></svg>
                          </a>
                        )}
                        {group.workbookUrl && (
                          <a
                            href={group.workbookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="교안"
                            className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </a>
                        )}
                      </div>

                      {/* 담당자 */}
                      {(group.manager || group.salesRep) && (
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          {group.manager && (
                            <span>매니저: <span className="text-gray-700">{group.manager}</span>
                              {group.managerEmail && <a href={`mailto:${group.managerEmail}`} className="ml-1 text-blue-500 hover:underline">{group.managerEmail}</a>}
                            </span>
                          )}
                          {group.salesRep && (
                            <span>영업: <span className="text-gray-700">{group.salesRep}</span>
                              {group.salesRepEmail && <a href={`mailto:${group.salesRepEmail}`} className="ml-1 text-blue-500 hover:underline">{group.salesRepEmail}</a>}
                            </span>
                          )}
                        </div>
                      )}

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
