import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listInstructors } from '../api/instructors'
import { listCourses } from '../api/courses'
import { getCalendar } from '../api/calendar'
import type { CalendarEvent } from '../api/calendar'
import { formatDateStr } from '../utils/date'

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function StatCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    amber: 'text-amber-700',
  }
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold mb-1 ${colorMap[color] ?? 'text-gray-700'}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

interface GroupedSchedule {
  courseId: string
  courseTitle: string
  mainTutors: string[]
  techTutors: string[]
  hasMainTutor: boolean
}

function groupEvents(events: CalendarEvent[]): GroupedSchedule[] {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const arr = map.get(ev.course_id) ?? []
    arr.push(ev)
    map.set(ev.course_id, arr)
  }
  const groups: GroupedSchedule[] = []
  for (const [courseId, evts] of map) {
    const mainTutors: string[] = []
    const techTutors: string[] = []
    for (const ev of evts) {
      if (ev.class_name === '기술지원') {
        techTutors.push(ev.instructor_name)
      } else {
        mainTutors.push(ev.instructor_name)
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
  groups.sort((a, b) => (a.hasMainTutor === b.hasMainTutor ? 0 : a.hasMainTutor ? 1 : -1))
  return groups
}

function ScheduleCard({ group }: { group: GroupedSchedule }) {
  return (
    <div className={`p-3 rounded-lg border ${
      group.hasMainTutor ? 'bg-green-50/50 border-green-200' : 'bg-orange-50/50 border-orange-300'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${group.hasMainTutor ? 'bg-green-500' : 'bg-orange-500'}`} />
        <span className="font-medium text-gray-800 text-sm">{group.courseTitle}</span>
        {!group.hasMainTutor && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">배정 필요</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs ml-4">
        <span className="text-gray-500">주강사</span>
        {group.mainTutors.length > 0 ? (
          <span className="text-blue-700">{group.mainTutors.join(', ')}</span>
        ) : (
          <span className="text-orange-600">미배정</span>
        )}
        {group.techTutors.length > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">기술지원</span>
            <span className="text-gray-600">{group.techTutors.join(', ')}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState<'today' | 'week'>('today')

  const today = new Date()
  const todayStr = formatDateStr(today)

  // 이번 주 월~일 계산
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekStartStr = formatDateStr(monday)
  const weekEndStr = formatDateStr(sunday)

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => listInstructors(),
  })
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses,
  })
  const { data: calendarData } = useQuery({
    queryKey: ['calendar', weekStartStr, weekEndStr],
    queryFn: () => getCalendar(weekStartStr, weekEndStr),
  })

  const events = calendarData?.events ?? []
  const todayEvents = events.filter((e) => String(e.date) === todayStr)
  const weekEvents = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date)))

  const activeInstructors = instructors.filter((i) => i.is_active).length
  const mainTutorCount = instructors.filter((i) => i.specialty !== 'Technical Tutor').length
  const techTutorCount = instructors.filter((i) => i.specialty === 'Technical Tutor').length
  const unassignedCourses = courses.filter((c) => c.assignment_status === '배정 미완료').length

  const todayLabel = `${today.getMonth() + 1}/${today.getDate()}`
  const weekLabel = `${monday.getMonth() + 1}/${monday.getDate()} ~ ${sunday.getMonth() + 1}/${sunday.getDate()}`

  const todayGroups = useMemo(() => groupEvents(todayEvents), [todayEvents])

  // 주간 이벤트를 날짜별 → 교육별 그룹화
  const weekByDate = useMemo(() => {
    const dateMap: Record<string, CalendarEvent[]> = {}
    for (const item of weekEvents) {
      const d = String(item.date);
      (dateMap[d] ??= []).push(item)
    }
    const result: Record<string, GroupedSchedule[]> = {}
    for (const [date, evts] of Object.entries(dateMap)) {
      result[date] = groupEvents(evts)
    }
    return result
  }, [weekEvents])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h2>

      <div className="flex gap-6">
        {/* 왼쪽: 통계 카드 */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          <StatCard title="활성 강사" value={`${activeInstructors}명`} sub={`주강사 ${mainTutorCount} / 기술 튜터 ${techTutorCount}`} color="blue" />
          <StatCard title="배정 미완료" value={`${unassignedCourses}개`} sub={`전체 ${courses.length}개`} color="green" />
          <StatCard title="이번 주 교육" value={`${Object.values(weekByDate).reduce((s, g) => s + g.length, 0)}건`} sub={weekLabel} color="purple" />
          <StatCard title="오늘 교육" value={`${todayGroups.length}건`} sub={todayStr} color="amber" />
        </div>

        {/* 오른쪽: 일정 타임라인 */}
        <div className="flex-1 bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">일정</h3>
            <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
              <button
                onClick={() => setTab('today')}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  tab === 'today' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                오늘 ({todayLabel})
              </button>
              <button
                onClick={() => setTab('week')}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  tab === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                이번 주
              </button>
            </div>
          </div>

          {tab === 'week' && Object.keys(weekByDate).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(weekByDate).map(([date, groups]) => {
                const d = new Date(date + 'T00:00:00')
                const dayLabel = `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY_NAMES[d.getDay()]})`
                return (
                  <div key={date}>
                    <p className="text-sm font-medium text-gray-500 mb-2">{dayLabel}</p>
                    <div className="space-y-2">
                      {groups.map((g) => <ScheduleCard key={g.courseId} group={g} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : tab === 'today' && todayGroups.length > 0 ? (
            <div className="space-y-3">
              {todayGroups.map((g) => <ScheduleCard key={g.courseId} group={g} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">예정된 일정이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
