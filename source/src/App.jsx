import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Preview from './pages/Preview'
import ThemeManager from './pages/ThemeManager'
import ModuleRegistryPage from './pages/ModuleRegistry'
import { PlatformAuditDebugger } from './core/platform/components/PlatformAuditDebugger'
import { CalendarPage } from './modules/events-calendar/pages/CalendarPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/theme" element={<ThemeManager />} />
          <Route path="/modules" element={<ModuleRegistryPage />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/debug" element={<PlatformAuditDebugger />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
