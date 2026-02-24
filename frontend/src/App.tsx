import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import InstructorLayout from './components/layout/InstructorLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Instructors from './pages/Instructors'
import Courses from './pages/Courses'
import Availability from './pages/Availability'
import Calendar from './pages/Calendar'
import InstructorSchedule from './pages/instructor/InstructorSchedule'
import InstructorCourses from './pages/instructor/InstructorCourses'

function RootRedirect() {
  const { loading, profile } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="text-gray-500">로딩 중...</div></div>
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'admin') return <Navigate to="/dashboard" replace />
  return <Navigate to="/instructor/schedule" replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* 관리자 */}
        <Route element={<ProtectedRoute requiredRole="admin"><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>

        {/* 강사 */}
        <Route element={<ProtectedRoute><InstructorLayout /></ProtectedRoute>}>
          <Route path="/instructor/schedule" element={<InstructorSchedule />} />
          <Route path="/instructor/courses" element={<InstructorCourses />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
