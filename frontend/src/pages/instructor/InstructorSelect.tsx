import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listInstructors } from '../../api/instructors'
import { useAuth } from '../../contexts/AuthContext'

export default function InstructorSelect() {
  const navigate = useNavigate()
  const { setInstructor } = useAuth()
  const [search, setSearch] = useState('')

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['instructors', true],
    queryFn: () => listInstructors(true),
  })

  const filtered = instructors.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(inst: { id: string; name: string }) {
    setInstructor(inst.id, inst.name)
    navigate('/instructor/schedule')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-800">강사 선택</h2>
          <p className="text-gray-500 mt-1 text-sm">본인의 이름을 선택하세요</p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 검색..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">검색 결과가 없습니다</div>
          ) : (
            filtered.map((inst) => (
              <button
                key={inst.id}
                onClick={() => handleSelect(inst)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition cursor-pointer"
              >
                <span className="font-medium text-gray-800">{inst.name}</span>
                {inst.specialty && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    {inst.specialty === 'Technical Tutor' ? '기술 튜터' : '주강사'}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => navigate('/login')}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          뒤로 가기
        </button>
      </div>
    </div>
  )
}
