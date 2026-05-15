import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Preview from './pages/Preview'
import { PlatformAuditDebugger } from './core/platform/components/PlatformAuditDebugger'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="editor" element={<Editor />} />
        <Route path="preview" element={<Preview />} />
        <Route path="debug" element={<PlatformAuditDebugger />} />
      </Route>
    </Routes>
  )
}

export default App
