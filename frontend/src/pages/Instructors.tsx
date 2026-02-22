import { useState } from 'react'
import { mockInstructors } from '../mocks/data'
import type { Instructor } from '../types'

function InstructorModal({
  instructor,
  onClose,
}: {
  instructor: Instructor | null
  onClose: () => void
}) {
  const isEdit = instructor !== null
  const defaults = instructor ?? {
    name: '',
    email: '',
    phone: '',
    specialty: '',
    is_active: true,
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isEdit ? '강사 수정' : '강사 등록'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input
              type="text"
              defaultValue={defaults.name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="강사 이름"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              defaultValue={defaults.email ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input
              type="tel"
              defaultValue={defaults.phone ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전문분야</label>
            <input
              type="text"
              defaultValue={defaults.specialty ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: JavaScript/React"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              defaultChecked={defaults.is_active}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">활성 상태</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={() => {
              alert('프로토타입: 저장 기능 예정')
              onClose()
            }}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
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
                  filterActive === f
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
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
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {inst.specialty}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      inst.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {inst.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
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
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    검색 결과가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <InstructorModal
          instructor={editTarget}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
