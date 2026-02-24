import { useState, useMemo, useRef, useEffect } from 'react'
import type { Course } from '../types'

export default function CourseCombobox({ courses, value, onChange }: {
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
