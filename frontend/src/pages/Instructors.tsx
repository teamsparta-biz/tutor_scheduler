import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listInstructors, createInstructor, updateInstructor, deleteInstructor, syncInstructors } from '../api/instructors'
import { getCalendar } from '../api/calendar'
import { listAvailability } from '../api/availability'
import Pagination from '../components/Pagination'
import type { CalendarEvent } from '../api/calendar'
import type { Availability } from '../api/availability'
import type { Instructor } from '../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const isTechTutor = (inst: Instructor) => inst.specialty === 'Technical Tutor'

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

// 강사 캘린더 모달 (읽기 전용)
function InstructorCalendarModal({ instructor, onClose }: { instructor: Instructor; onClose: () => void }) {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const startDate = days[0].dateStr
  const endDate = days[days.length - 1].dateStr

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => getCalendar(startDate, endDate),
  })

  const { data: availData = [] } = useQuery({
    queryKey: ['availability', instructor.id, startDate, endDate],
    queryFn: () => listAvailability({ instructor_id: instructor.id, start_date: startDate, end_date: endDate }),
  })

  const instEvents = useMemo(() => {
    const events = calendarData?.events ?? []
    return events.filter((e) => e.instructor_id === instructor.id)
  }, [calendarData, instructor.id])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of instEvents) {
      const d = String(ev.date)
      const arr = map.get(d) ?? []
      arr.push(ev)
      map.set(d, arr)
    }
    return map
  }, [instEvents])

  const availByDate = useMemo(() => {
    const map = new Map<string, Availability>()
    for (const av of availData) {
      map.set(String(av.date), av)
    }
    return map
  }, [availData])

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11) }
    else setCurrentMonth(currentMonth - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0) }
    else setCurrentMonth(currentMonth + 1)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{instructor.name} 일정</h3>
            <p className="text-sm text-gray-500">
              {isTechTutor(instructor) ? '기술 튜터' : '주강사'}
              {instructor.email ? ` | ${instructor.email}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">x</button>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> 배정됨</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> 가능</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> 불가</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> 미정</span>
        </div>

        {/* 월 이동 */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-28 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* 캘린더 (읽기 전용) */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} className={`px-1 py-1.5 text-center text-xs font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}>{wd}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((day) => {
                const dayEvents = eventsByDate.get(day.dateStr) ?? []
                const avail = availByDate.get(day.dateStr)
                const hasEvents = dayEvents.length > 0
                const dow = day.date.getDay()

                const cellBg = hasEvents
                  ? 'bg-blue-50'
                  : avail?.status === 'available'
                    ? 'bg-green-50'
                  : avail?.status === 'unavailable'
                    ? 'bg-red-50'
                    : ''

                return (
                  <div
                    key={day.dateStr}
                    className={`min-h-14 p-1 border-r border-gray-100 last:border-r-0 text-left ${
                      day.isCurrentMonth ? '' : 'opacity-30'
                    } ${cellBg}`}
                  >
                    <div className={`text-xs font-medium ${
                      dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                    }`}>
                      {day.date.getDate()}
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.map((ev) => (
                        <div key={ev.assignment_id} className="text-[10px] px-1 py-px rounded bg-blue-100 text-blue-700 truncate" title={`${ev.course_title} ${ev.class_name ?? ''}`}>
                          {ev.course_title.slice(0, 6)} {ev.class_name}
                        </div>
                      ))}
                      {!hasEvents && avail?.status === 'available' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">가능</span>
                      )}
                      {!hasEvents && avail?.status === 'unavailable' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">불가</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InstructorModal({
  instructor,
  onClose,
  onSaved,
}: {
  instructor: Instructor | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = instructor !== null
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const authEmailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const activeRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaults = instructor ?? { name: '', email: '', auth_email: '', phone: '', specialty: '', is_active: true }

  async function handleSubmit() {
    const name = nameRef.current?.value.trim() ?? ''
    if (!name) { setError('이름을 입력해주세요'); return }

    setSaving(true)
    setError(null)
    try {
      const data = {
        name,
        email: emailRef.current?.value.trim() || null,
        auth_email: authEmailRef.current?.value.trim() || null,
        phone: phoneRef.current?.value.trim() || null,
        is_active: activeRef.current?.checked ?? true,
      }
      if (isEdit) {
        await updateInstructor(instructor.id, data)
      } else {
        await createInstructor(data)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isEdit ? '강사 수정' : '강사 등록'}
        </h3>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input ref={nameRef} type="text" defaultValue={defaults.name} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="강사 이름" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 이메일</label>
            <input ref={emailRef} type="email" defaultValue={defaults.email ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">로그인 이메일</label>
            <input ref={authEmailRef} type="email" defaultValue={defaults.auth_email ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Google 로그인에 사용하는 이메일" />
            <p className="text-xs text-gray-400 mt-1">연락처와 다른 이메일로 로그인할 경우 입력</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input ref={phoneRef} type="tel" defaultValue={defaults.phone ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="010-0000-0000" />
          </div>
          <div className="flex items-center gap-2">
            <input ref={activeRef} type="checkbox" id="is_active" defaultChecked={defaults.is_active} className="rounded border-gray-300" />
            <label htmlFor="is_active" className="text-sm text-gray-700">활성 상태</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50">취소</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50">
            {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Instructors() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterRole, setFilterRole] = useState<'all' | 'main' | 'tech'>('main')
  const [sortKey, setSortKey] = useState<'name' | 'role'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 30
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Instructor | null>(null)
  const [calendarTarget, setCalendarTarget] = useState<Instructor | null>(null)

  const { data: instructors = [], isLoading, error } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => listInstructors(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInstructor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructors'] }),
  })

  const syncMutation = useMutation({
    mutationFn: syncInstructors,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] })
      alert(`강사 동기화 완료: ${result.tutors}명`)
    },
    onError: (err) => {
      alert(`동기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    },
  })

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['instructors'] })
  }

  function handleDelete(inst: Instructor) {
    if (!confirm(`${inst.name} 강사를 삭제하시겠습니까?`)) return
    deleteMutation.mutate(inst.id)
  }

  const filtered = instructors.filter((inst) => {
    if (filterActive === 'active' && !inst.is_active) return false
    if (filterActive === 'inactive' && inst.is_active) return false
    if (filterRole === 'main' && isTechTutor(inst)) return false
    if (filterRole === 'tech' && !isTechTutor(inst)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        inst.name.toLowerCase().includes(q) ||
        (inst.email?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name, 'ko')
      } else {
        // 주강사(0) vs 기술튜터(1)
        cmp = (isTechTutor(a) ? 1 : 0) - (isTechTutor(b) ? 1 : 0)
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  function handleSort(key: 'name' | 'role') {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const sortArrow = (key: 'name' | 'role') =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  const mainCount = instructors.filter((i) => !isTechTutor(i)).length
  const techCount = instructors.filter((i) => isTechTutor(i)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 관리</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncMutation.isPending ? '동기화 중...' : '강사 동기화'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="이름, 이메일, 전문분야 검색..."
            className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
            {([['main', `주강사 (${mainCount})`], ['tech', `기술 튜터 (${techCount})`], ['all', `전체 (${instructors.length})`]] as const).map(([f, label]) => (
              <button
                key={f}
                onClick={() => { setFilterRole(f as 'all' | 'main' | 'tech'); setPage(1) }}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  filterRole === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilterActive(f); setPage(1) }}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  filterActive === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '활성' : '비활성'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400">불러오는 중...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">오류: {error instanceof Error ? error.message : '불러오기 실패'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium w-10"></th>
                  <th className="pb-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => handleSort('name')}>이름{sortArrow('name')}</th>
                  <th className="pb-3 font-medium cursor-pointer select-none hover:text-gray-800" onClick={() => handleSort('role')}>역할{sortArrow('role')}</th>
                  <th className="pb-3 font-medium">이메일</th>
                  <th className="pb-3 font-medium">연락처</th>
                  <th className="pb-3 font-medium">상태</th>
                  <th className="pb-3 font-medium text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((inst) => (
                  <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <button
                        onClick={() => setCalendarTarget(inst)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer transition"
                        title={`${inst.name} 일정 보기`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </td>
                    <td className="py-3 font-medium text-gray-800">{inst.name}</td>
                    <td className="py-3">
                      {isTechTutor(inst) ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">기술 튜터</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">주강사</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-600">{inst.email ?? '-'}</td>
                    <td className="py-3 text-gray-600">{inst.phone ?? '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        inst.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {inst.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => { setEditTarget(inst); setModalOpen(true) }}
                        className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(inst)}
                        className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">검색 결과가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {modalOpen && (
        <InstructorModal instructor={editTarget} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
      {calendarTarget && (
        <InstructorCalendarModal instructor={calendarTarget} onClose={() => setCalendarTarget(null)} />
      )}
    </div>
  )
}
