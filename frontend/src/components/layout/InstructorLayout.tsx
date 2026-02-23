import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function InstructorLayout() {
  const { instructorName, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm rounded-md transition ${
      isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-gray-800">강사 포털</h1>
          <nav className="flex gap-1">
            <NavLink to="/instructor/schedule" className={linkClass}>내 일정</NavLink>
            <NavLink to="/instructor/courses" className={linkClass}>배정 교육</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{instructorName} 강사님</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  )
}
