import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { profile, loading, denied, signInWithGoogle, logout } = useAuth()

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'admin') navigate('/', { replace: true })
      else navigate('/instructor/schedule', { replace: true })
    }
  }, [loading, profile, navigate])

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-2">
            현재 로그인한 계정이 강사로 등록되어 있지 않습니다.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 font-medium mb-2">다음 방법으로 해결할 수 있습니다:</p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>담당 매니저에게 이 계정의 <strong>인증을 요청</strong>하세요.</li>
              <li>또는 등록된 다른 이메일로 다시 로그인하세요.</li>
            </ol>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">IS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">강사 일정 관리</h1>
          <p className="text-gray-500 mt-2">Google 계정으로 로그인하세요</p>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-medium">
            {loading ? '로딩 중...' : 'Google로 로그인'}
          </span>
        </button>

        <p className="text-xs text-gray-400 mt-6">
          @teamsparta.co 계정 또는 등록된 강사 이메일로 로그인하세요
        </p>
      </div>
    </div>
  )
}
