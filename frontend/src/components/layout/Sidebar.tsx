import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/instructors', label: '강사 관리' },
  { to: '/courses', label: '교육 일정' },
  { to: '/availability', label: '강사 가용성' },
  { to: '/calendar', label: '캘린더' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm ${
                isActive
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
