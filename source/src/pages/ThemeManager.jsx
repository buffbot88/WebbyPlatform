import { useState } from 'react'
import { useSiteSettings, COLOR_PRESETS, FONT_OPTIONS, RADIUS_OPTIONS } from '../context/SiteSettingsContext'

function PreviewCard({ settings }) {
  const font = FONT_OPTIONS.find(f => f.id === settings.fontFamily) || FONT_OPTIONS[0]
  const radiusMap = { sharp: '2px', rounded: '8px', pill: '24px' }
  const radius = radiusMap[settings.borderRadius] || '8px'

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div
        className="px-6 py-10 text-white text-center"
        style={{ background: settings.primaryColor, fontFamily: font.stack }}
      >
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: font.stack }}>
          {settings.siteName}
        </h2>
        <p className="opacity-90 text-sm mb-5" style={{ fontFamily: font.stack }}>
          AI-powered website builder platform
        </p>
        <button
          className="px-5 py-2 text-sm font-semibold bg-white transition-opacity hover:opacity-90"
          style={{ color: settings.primaryColor, borderRadius: radius, fontFamily: font.stack }}
        >
          Get Started
        </button>
      </div>
      <div className="p-5" style={{ fontFamily: font.stack }}>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
          UI Elements
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-1.5 text-sm font-medium text-white"
            style={{ background: settings.primaryColor, borderRadius: radius }}
          >
            Primary
          </button>
          <button
            className="px-4 py-1.5 text-sm font-medium border"
            style={{
              color: settings.primaryColor,
              borderColor: settings.primaryColor,
              borderRadius: radius
            }}
          >
            Outline
          </button>
          <span
            className="px-3 py-1 text-xs font-medium"
            style={{
              background: settings.primaryColor + '18',
              color: settings.primaryColor,
              borderRadius: radius
            }}
          >
            Badge
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full w-3/5 rounded-full" style={{ background: settings.primaryColor }} />
          </div>
          <p className="text-sm text-gray-700" style={{ fontFamily: font.stack }}>
            The quick brown fox jumps over the lazy dog. <span style={{ color: settings.primaryColor }}>Colored link text.</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ThemeManager() {
  const { settings, updateSettings } = useSiteSettings()
  const [customColor, setCustomColor] = useState(settings.primaryColor)

  const handleColorPreset = (color) => {
    setCustomColor(color)
    updateSettings({ primaryColor: color })
  }

  const handleCustomColor = (e) => {
    const color = e.target.value
    setCustomColor(color)
    updateSettings({ primaryColor: color })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Theme Manager</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize your platform's look and feel. Changes apply instantly across the app.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">

          {/* Color */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Primary Color</h3>
            <p className="text-sm text-gray-500 mb-4">Used for buttons, links, accents, and highlights.</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  title={preset.label}
                  onClick={() => handleColorPreset(preset.value)}
                  className="relative h-10 rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    background: preset.value,
                    focusRingColor: preset.value,
                    boxShadow: settings.primaryColor === preset.value
                      ? `0 0 0 3px white, 0 0 0 5px ${preset.value}`
                      : undefined
                  }}
                >
                  {settings.primaryColor === preset.value && (
                    <svg className="w-4 h-4 text-white absolute inset-0 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColor}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Custom hex value</label>
                <input
                  type="text"
                  value={customColor}
                  onChange={e => {
                    const v = e.target.value
                    setCustomColor(v)
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) updateSettings({ primaryColor: v })
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="#4f46e5"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Font Family</h3>
            <p className="text-sm text-gray-500 mb-4">Applied to body text throughout the platform.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FONT_OPTIONS.map(font => (
                <button
                  key={font.id}
                  onClick={() => updateSettings({ fontFamily: font.id })}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    settings.fontFamily === font.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p
                      className="font-medium text-gray-900 text-sm"
                      style={{ fontFamily: font.stack }}
                    >
                      {font.label}
                    </p>
                    <p
                      className="text-xs text-gray-500 mt-0.5"
                      style={{ fontFamily: font.stack }}
                    >
                      The quick brown fox
                    </p>
                  </div>
                  {settings.fontFamily === font.id && (
                    <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Border Radius</h3>
            <p className="text-sm text-gray-500 mb-4">Controls the roundness of buttons, cards, and inputs.</p>
            <div className="flex gap-3">
              {RADIUS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateSettings({ borderRadius: opt.id })}
                  className={`flex-1 flex flex-col items-center gap-3 rounded-xl border py-4 px-3 transition-colors ${
                    settings.borderRadius === opt.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-12 h-8 border-2"
                    style={{
                      borderRadius: opt.value,
                      borderColor: settings.borderRadius === opt.id ? '#4f46e5' : '#d1d5db',
                      background: settings.borderRadius === opt.id ? '#eef2ff' : '#f9fafb'
                    }}
                  />
                  <span className={`text-sm font-medium ${
                    settings.borderRadius === opt.id ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Live Preview</h3>
            <p className="text-xs text-gray-500 mt-0.5">Updates as you change settings</p>
          </div>
          <PreviewCard settings={settings} />
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
            All theme settings are saved automatically to your browser.
          </div>
        </div>
      </div>
    </div>
  )
}
