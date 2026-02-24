import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { getCalendar } from '../../api/calendar'
import type { CalendarEvent } from '../../api/calendar'
import { listAvailability, createAvailability, deleteAvailability } from '../../api/availability'
import type { Availability } from '../../api/availability'
import { getCalendarDays } from '../../utils/date'
import type { CalendarDay } from '../../utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function InstructorSchedule() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const instructorId = profile?.instructor_id ?? null
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`
  const startDate = days[0]?.dateStr ?? ''
  const endDate = days[days.length - 1]?.dateStr ?? ''

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => getCalendar(startDate, endDate),
    enabled: !!startDate && !!instructorId,
  })

  const { data: availData = [] } = useQuery({
    queryKey: ['availability', instructorId, startDate, endDate],
    queryFn: () => listAvailability({ instructor_id: instructorId!, start_date: startDate, end_date: endDate }),
    enabled: !!instructorId && !!startDate,
  })

  const assignedMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of calendarData?.events ?? []) {
      if (ev.instructor_id === instructorId) {
        const d = String(ev.date)
        const arr = map.get(d) ?? []
        arr.push(ev)
        map.set(d, arr)
      }
    }
    return map
  }, [calendarData, instructorId])

  const availMap = useMemo(() => {
    const map = new Map<string, Availability>()
    for (const av of availData) map.set(String(av.date), av)
    return map
  }, [availData])

  const upsertMut = useMutation({
    mutationFn: createAvailability,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['availability', instructorId, startDate, endDate],
    }),
  })

  const removeMut = useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['availability', instructorId, startDate, endDate],
    }),
  })

  function handleDayClick(dateStr: string) {
    if (!instructorId || assignedMap.has(dateStr)) return
    const existing = availMap.get(dateStr)
    if (!existing) {
      upsertMut.mutate({ instructor_id: instructorId, date: dateStr, status: 'available' })
    } else if (existing.status === 'available') {
      upsertMut.mutate({ instructor_id: instructorId, date: dateStr, status: 'unavailable' })
    } else {
      removeMut.mutate(existing.id)
    }
  }

  // 이번 달 요약 통계
  const stats = useMemo(() => {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth)
    let assigned = 0, available = 0, unavailable = 0, pending = 0
    for (const day of currentMonthDays) {
      if (assignedMap.has(day.dateStr)) { assigned++; continue }
      const av = availMap.get(day.dateStr)
      if (av?.status === 'available') available++
      else if (av?.status === 'unavailable') unavailable++
      else pending++
    }
    return { assigned, available, unavailable, pending }
  }, [days, assignedMap, availMap])

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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">내 일정</h2>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> 배정됨</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> 가능</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> 불가</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> 미정</span>
        <span className="text-gray-400 ml-2">클릭: 미정 &rarr; 가능 &rarr; 불가 &rarr; 미정</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800 min-w-32 text-center">{monthLabel}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
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
              const dayEvents = assignedMap.get(day.dateStr) ?? []
              const assigned = dayEvents.length > 0
              const avail = availMap.get(day.dateStr)
              const status = assigned ? 'assigned' : avail?.status ?? null
              const dow = day.date.getDay()

              const cellBg = status === 'assigned' ? 'bg-blue-50'
                : status === 'available' ? 'bg-green-50'
                : status === 'unavailable' ? 'bg-red-50'
                : 'hover:bg-gray-50'

              return (
                <button
                  key={day.dateStr}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.dateStr)}
                  className={`min-h-16 p-2 border-r border-gray-100 last:border-r-0 transition text-left ${
                    assigned ? 'cursor-default' : 'cursor-pointer'
                  } ${day.isCurrentMonth ? '' : 'opacity-30'} ${cellBg}`}
                >
                  <div className={`text-sm font-medium ${
                    dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.map((ev) => (
                      <div key={ev.assignment_id} className="text-[10px] px-1 py-px rounded bg-blue-100 text-blue-700 truncate" title={`${ev.course_title} ${ev.class_name ?? ''}`}>
                        {ev.course_title.length > 8 ? ev.course_title.slice(0, 8) + '…' : ev.course_title}
                      </div>
                    ))}
                    {!assigned && avail?.status === 'available' && (
                      <span className="text-xs px-1.5 py-0.5 rounded border bg-green-100 text-green-700 border-green-200">가능</span>
                    )}
                    {!assigned && avail?.status === 'unavailable' && (
                      <span className="text-xs px-1.5 py-0.5 rounded border bg-red-100 text-red-700 border-red-200">불가</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* 이번 달 요약 통계 */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          <div className="text-sm text-gray-500 mt-1">배정됨</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-sm text-gray-500 mt-1">가능</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.unavailable}</div>
          <div className="text-sm text-gray-500 mt-1">불가</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
          <div className="text-sm text-gray-500 mt-1">미정</div>
        </div>
      </div>
    </div>
  )
}
