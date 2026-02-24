import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const displayName = profile?.display_name ?? profile?.email ?? '관리자'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-800">강사 일정 관리</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{displayName}</span>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">{initial}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
