import { useState, useMemo } from 'react'
import { mockInstructors, mockAvailability, mockAssignments, mockCourseDates, mockCourses } from '../mocks/data'
import type { Instructor, InstructorAvailability } from '../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const statusLabel: Record<InstructorAvailability['status'], string> = {
  available: '가능',
  unavailable: '불가',
  pending: '미정',
}
const statusColor: Record<InstructorAvailability['status'], { bg: string; text: string }> = {
  available: { bg: 'bg-green-50', text: 'text-green-700' },
  unavailable: { bg: 'bg-red-50', text: 'text-red-700' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
}

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

// 강사 캘린더 모달
function InstructorCalendarModal({ instructor, onClose }: { instructor: Instructor; onClose: () => void }) {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(1)

  const days = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth])
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`

  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const instAvail = mockAvailability.filter((a) => a.instructor_id === instructor.id)
  const instAssignments = mockAssignments.filter((a) => a.instructor_id === instructor.id)

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
            <p className="text-sm text-gray-500">{instructor.specialty} | {instructor.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">x</button>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> 가능</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> 불가</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> 미정</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> 배정됨</span>
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

        {/* 캘린더 */}
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
                const av = instAvail.find((a) => a.date === day.dateStr)
                const dayAssignments = instAssignments.filter((a) => a.date === day.dateStr)
                const sc = av ? statusColor[av.status] : null
                const dow = day.date.getDay()

                return (
                  <div
                    key={day.dateStr}
                    className={`min-h-14 p-1 border-r border-gray-100 last:border-r-0 ${
                      day.isCurrentMonth ? '' : 'opacity-30'
                    } ${sc ? sc.bg : ''}`}
                  >
                    <div className={`text-xs font-medium ${
                      dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                    }`}>
                      {day.date.getDate()}
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {av && (
                        <span className={`text-[10px] px-1 py-px rounded ${sc!.bg} ${sc!.text}`}>
                          {statusLabel[av.status]}
                        </span>
                      )}
                      {dayAssignments.map((asgn) => {
                        const cd = mockCourseDates.find((c) => c.id === asgn.course_date_id)
                        const course = cd ? mockCourses.find((c) => c.id === cd.course_id) : null
                        return (
                          <div key={asgn.id} className="text-[10px] px-1 py-px rounded bg-blue-100 text-blue-700 truncate">
                            {course?.title?.slice(0, 8) ?? '-'} {asgn.class_name}
                          </div>
                        )
                      })}
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

function InstructorModal({ instructor, onClose }: { instructor: Instructor | null; onClose: () => void }) {
  const isEdit = instructor !== null
  const defaults = instructor ?? { name: '', email: '', phone: '', specialty: '', is_active: true }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isEdit ? '강사 수정' : '강사 등록'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input type="text" defaultValue={defaults.name} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="강사 이름" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input type="email" defaultValue={defaults.email ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input type="tel" defaultValue={defaults.phone ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="010-0000-0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전문분야</label>
            <input type="text" defaultValue={defaults.specialty ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="예: JavaScript/React" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" defaultChecked={defaults.is_active} className="rounded border-gray-300" />
            <label htmlFor="is_active" className="text-sm text-gray-700">활성 상태</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">취소</button>
          <button onClick={() => { alert('프로토타입: 저장 기능 예정'); onClose() }} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">
            {isEdit ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Instructors() {
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Instructor | null>(null)
  const [calendarTarget, setCalendarTarget] = useState<Instructor | null>(null)

  const filtered = mockInstructors.filter((inst) => {
    if (filterActive === 'active' && !inst.is_active) return false
    if (filterActive === 'inactive' && inst.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        inst.name.toLowerCase().includes(q) ||
        (inst.email?.toLowerCase().includes(q) ?? false) ||
        (inst.specialty?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">강사 관리</h2>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          + 강사 등록
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 이메일, 전문분야 검색..."
            className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  filterActive === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '활성' : '비활성'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">이름</th>
                <th className="pb-3 font-medium">이메일</th>
                <th className="pb-3 font-medium">연락처</th>
                <th className="pb-3 font-medium">전문분야</th>
                <th className="pb-3 font-medium">상태</th>
                <th className="pb-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => (
                <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{inst.name}</td>
                  <td className="py-3 text-gray-600">{inst.email ?? '-'}</td>
                  <td className="py-3 text-gray-600">{inst.phone ?? '-'}</td>
                  <td className="py-3">
                    {inst.specialty ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{inst.specialty}</span>
                    ) : '-'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      inst.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {inst.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => setCalendarTarget(inst)}
                      className="text-green-600 hover:text-green-800 text-sm cursor-pointer"
                    >
                      일정
                    </button>
                    <button
                      onClick={() => { setEditTarget(inst); setModalOpen(true) }}
                      className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">검색 결과가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <InstructorModal instructor={editTarget} onClose={() => setModalOpen(false)} />
      )}
      {calendarTarget && (
        <InstructorCalendarModal instructor={calendarTarget} onClose={() => setCalendarTarget(null)} />
      )}
    </div>
  )
}
