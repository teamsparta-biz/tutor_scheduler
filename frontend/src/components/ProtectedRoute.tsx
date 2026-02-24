import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  requiredRole?: 'admin' | 'instructor'
  children: React.ReactNode
}

export default function ProtectedRoute({ requiredRole, children }: Props) {
  const { loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'admin' && profile.role !== 'admin') {
    return <Navigate to="/instructor/schedule" replace />
  }

  return <>{children}</>
}
