import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Instructors from './pages/Instructors'
import Courses from './pages/Courses'
import Assignments from './pages/Assignments'
import Calendar from './pages/Calendar'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/instructors" element={<Instructors />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>
    </Routes>
  )
}

export default App
