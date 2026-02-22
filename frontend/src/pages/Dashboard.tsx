import { useState } from 'react'
import { mockInstructors, mockCourses, mockAssignments, mockCourseDates } from '../mocks/data'

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

const activeInstructors = mockInstructors.filter((i) => i.is_active).length
const thisMonthCourses = mockCourses.filter((c) => c.status !== '완료').length
const thisWeekAssignments = mockAssignments.filter((a) => {
  const d = new Date(a.date)
  return d >= new Date('2026-02-16') && d <= new Date('2026-02-22')
}).length

const recentAssignments = mockAssignments.map((a) => {
  const instructor = mockInstructors.find((i) => i.id === a.instructor_id)
  const courseDate = mockCourseDates.find((cd) => cd.id === a.course_date_id)
  const course = courseDate ? mockCourses.find((c) => c.id === courseDate.course_id) : null
  return { ...a, instructorName: instructor?.name ?? '-', courseTitle: course?.title ?? '-' }
})

function DashboardA() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="활성 강사" value={`${activeInstructors}명`} sub={`전체 ${mockInstructors.length}명`} color="blue" />
        <StatCard title="이번 달 교육" value={`${thisMonthCourses}개`} sub="진행중 1, 예정 1" color="green" />
        <StatCard title="이번 주 배정" value={`${thisWeekAssignments}건`} sub="2/16 ~ 2/22" color="purple" />
        <StatCard title="Notion 동기화" value="2시간 전" sub="마지막 동기화" color="amber" />
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 배정</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">교육</th>
                <th className="pb-3 font-medium">날짜</th>
                <th className="pb-3 font-medium">반</th>
                <th className="pb-3 font-medium">강사</th>
              </tr>
            </thead>
            <tbody>
              {recentAssignments.map((a) => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{a.courseTitle}</td>
                  <td className="py-3 text-gray-600">{a.date}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 text-xs">{a.class_name}</span>
                  </td>
                  <td className="py-3 text-gray-800">{a.instructorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DashboardB() {
  const todaySchedule = [
    { time: '09:00', course: '프론트엔드 부트캠프 5기', instructor: '김민수', className: 'A반', color: 'blue' },
    { time: '09:00', course: '프론트엔드 부트캠프 5기', instructor: '박준혁', className: 'B반', color: 'blue' },
    { time: '14:00', course: '백엔드 심화 과정 3기', instructor: '최유진', className: 'A반', color: 'green' },
    { time: '14:00', course: '백엔드 심화 과정 3기', instructor: '김민수', className: 'B반', color: 'green' },
  ]

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <StatCard title="활성 강사" value={`${activeInstructors}명`} sub={`전체 ${mockInstructors.length}명`} color="blue" />
        <StatCard title="이번 달 교육" value={`${thisMonthCourses}개`} sub="진행중 1, 예정 1" color="green" />
        <StatCard title="이번 주 배정" value={`${thisWeekAssignments}건`} sub="2/16 ~ 2/22" color="purple" />
        <StatCard title="Notion 동기화" value="2시간 전" sub="마지막 동기화" color="amber" />
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">오늘의 일정 (2/18)</h3>
        <div className="space-y-3">
          {todaySchedule.map((item, idx) => {
            const bgColor = item.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
            const dotColor = item.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
            return (
              <div key={idx} className={`flex items-start gap-4 p-3 rounded-lg border ${bgColor}`}>
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                  <span className="text-xs text-gray-500 mt-1">{item.time}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{item.course}</p>
                  <p className="text-sm text-gray-600">{item.instructor} — {item.className}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  const accent = colorMap[color] ?? 'bg-gray-50 text-gray-700'

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold mb-1 ${accent.split(' ')[1]}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const [variant, setVariant] = useState<'A' | 'B'>('A')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">레이아웃:</span>
          <ABToggle variant={variant} onChange={setVariant} />
        </div>
      </div>
      {variant === 'A' ? <DashboardA /> : <DashboardB />}
    </div>
  )
}
