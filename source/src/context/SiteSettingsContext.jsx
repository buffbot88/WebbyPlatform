/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'

const SiteSettingsContext = createContext(null)

const STORAGE_KEY = 'webby_site_settings'

export const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter', stack: 'Inter, sans-serif' },
  { id: 'Poppins', label: 'Poppins', stack: 'Poppins, sans-serif' },
  { id: 'Roboto', label: 'Roboto', stack: 'Roboto, sans-serif' },
  { id: 'Georgia', label: 'Georgia', stack: 'Georgia, serif' },
  { id: 'Mono', label: 'Monospace', stack: "'Courier New', monospace" }
]

export const RADIUS_OPTIONS = [
  { id: 'sharp', label: 'Sharp', value: '2px', preview: 'rounded-sm' },
  { id: 'rounded', label: 'Rounded', value: '8px', preview: 'rounded-lg' },
  { id: 'pill', label: 'Pill', value: '24px', preview: 'rounded-full' }
]

export const COLOR_PRESETS = [
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Slate', value: '#475569' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Teal', value: '#14b8a6' }
]

const DEFAULT_SETTINGS = {
  siteName: 'Webby Platform',
  lightDark: 'light',
  primaryColor: '#4f46e5',
  fontFamily: 'Inter',
  borderRadius: 'rounded'
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function applyCSSVariables(settings) {
  const root = document.documentElement
  const font = FONT_OPTIONS.find(f => f.id === settings.fontFamily) || FONT_OPTIONS[0]
  const radius = RADIUS_OPTIONS.find(r => r.id === settings.borderRadius) || RADIUS_OPTIONS[1]
  root.style.setProperty('--color-primary', settings.primaryColor)
  root.style.setProperty('--font-body', font.stack)
  root.style.setProperty('--radius-ui', radius.value)
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    document.title = settings.siteName
  }, [settings.siteName])

  useEffect(() => {
    applyCSSVariables(settings)
  }, [settings.primaryColor, settings.fontFamily, settings.borderRadius])

  const updateSettings = (patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        console.warn('[SiteSettings] Failed to persist settings', err)
      }
      return next
    })
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  return ctx
}
