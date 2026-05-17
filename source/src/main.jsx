import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { SiteProvider } from './modules/site-builder/context/SiteContext'
import './modules/site-builder/sections' // Register sections
import { registerEventsCalendarModule } from './modules/events-calendar'
import './index.css'
import App from './App.jsx'

// Register the Events Calendar module with the platform
registerEventsCalendarModule()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
          <SiteProvider>
            <App />
          </SiteProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
