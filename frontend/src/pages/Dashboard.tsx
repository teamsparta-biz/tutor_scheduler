import { useState } from 'react'
import { mockInstructors, mockCourses, mockAssignments, mockCourseDates, mockCoursePMs } from '../mocks/data'

const activeInstructors = mockInstructors.filter((i) => i.is_active).length
const thisMonthCourses = mockCourses.filter((c) => c.status !== '완료').length
const thisWeekAssignments = mockAssignments.filter((a) => {
  const d = new Date(a.date)
  return d >= new Date('2026-02-16') && d <= new Date('2026-02-22')
}).length

function enrichAssignment(a: typeof mockAssignments[number]) {
  const instructor = mockInstructors.find((i) => i.id === a.instructor_id)
  const courseDate = mockCourseDates.find((cd) => cd.id === a.course_date_id)
  const course = courseDate ? mockCourses.find((c) => c.id === courseDate.course_id) : null
  const pms = course ? mockCoursePMs[course.id] ?? [] : []
  return {
    ...a,
    instructorName: instructor?.name ?? '-',
    courseTitle: course?.title ?? '-',
    pms,
  }
}

const todayAssignments = mockAssignments
  .filter((a) => a.date === '2026-02-18')
  .map(enrichAssignment)

const weekAssignments = mockAssignments
  .filter((a) => {
    const d = new Date(a.date)
    return d >= new Date('2026-02-16') && d <= new Date('2026-02-22')
  })
  .sort((a, b) => a.date.localeCompare(b.date))
  .map(enrichAssignment)

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

function ScheduleItem({ item }: { item: ReturnType<typeof enrichAssignment> }) {
  const statusColors: Record<string, { bg: string; border: string; dot: string }> = {
    '진행중': { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
    '예정': { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
    '완료': { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
  }
  const cd = mockCourseDates.find((c) => c.id === item.course_date_id)
  const course = cd ? mockCourses.find((c) => c.id === cd.course_id) : null
  const defaultColors = { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-500' }
  const colors = course?.status ? statusColors[course.status] ?? defaultColors : defaultColors

  return (
    <div className={`flex items-start gap-4 p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex flex-col items-center pt-0.5">
        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{item.courseTitle}</p>
        <p className="text-sm text-gray-600">{item.instructorName} — {item.class_name}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState<'today' | 'week'>('today')
  const scheduleItems = tab === 'today' ? todayAssignments : weekAssignments

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h2>

      <div className="flex gap-6">
        {/* 왼쪽: 통계 카드 */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          <StatCard title="활성 강사" value={`${activeInstructors}명`} sub={`전체 ${mockInstructors.length}명`} color="blue" />
          <StatCard title="이번 달 교육" value={`${thisMonthCourses}개`} sub="진행중 1, 예정 1" color="green" />
          <StatCard title="이번 주 배정" value={`${thisWeekAssignments}건`} sub="2/16 ~ 2/22" color="purple" />
          <StatCard title="Notion 동기화" value="2시간 전" sub="마지막 동기화" color="amber" />
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
                오늘 (2/18)
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

          {tab === 'week' && scheduleItems.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(
                scheduleItems.reduce<Record<string, typeof scheduleItems>>((acc, item) => {
                  (acc[item.date] ??= []).push(item)
                  return acc
                }, {})
              ).map(([date, items]) => {
                const d = new Date(date + 'T00:00:00')
                const dayLabel = `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY_NAMES[d.getDay()]})`
                return (
                  <div key={date}>
                    <p className="text-sm font-medium text-gray-500 mb-2">{dayLabel}</p>
                    <div className="space-y-2">
                      {items.map((item) => <ScheduleItem key={item.id} item={item} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : tab === 'today' && scheduleItems.length > 0 ? (
            <div className="space-y-3">
              {scheduleItems.map((item) => <ScheduleItem key={item.id} item={item} />)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">예정된 일정이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
