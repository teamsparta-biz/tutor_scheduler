import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import InstructorLayout from './components/layout/InstructorLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Instructors from './pages/Instructors'
import Courses from './pages/Courses'
import Availability from './pages/Availability'
import Calendar from './pages/Calendar'
import InstructorSelect from './pages/instructor/InstructorSelect'
import InstructorSchedule from './pages/instructor/InstructorSchedule'
import InstructorCourses from './pages/instructor/InstructorCourses'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/instructor/select" element={<InstructorSelect />} />

        {/* 관리자 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>

        {/* 강사 */}
        <Route element={<InstructorLayout />}>
          <Route path="/instructor/schedule" element={<InstructorSchedule />} />
          <Route path="/instructor/courses" element={<InstructorCourses />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
