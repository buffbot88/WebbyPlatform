import { SinglePageRenderer } from './SinglePageRenderer'
import { MultiPageRenderer } from './MultiPageRenderer'
import { buildNavigation } from '../services/NavigationBuilder'

const getThemeStyles = (theme = {}) => {
  const styles = {}

  if (theme.primaryColor) {
    styles['--site-primary-color'] = theme.primaryColor
  }
  if (theme.font) {
    styles.fontFamily = theme.font
  }

  return styles
}

/**
 * SiteRenderer - Main rendering orchestrator
 * Dynamically selects the appropriate renderer based on site.mode
 * Supports: 'single' and 'multi' modes
 */
export function SiteRenderer({ site }) {
  if (!site) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No site data available</p>
        </div>
      </div>
    )
  }

  const mode = site.mode || 'single'
  const navigation = buildNavigation(site)
  const themeStyles = getThemeStyles(site.theme)

  return (
    <div className="site-renderer" data-mode={mode} style={themeStyles}>
      <div className="mb-4 px-4 py-3 rounded-b border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">
          Preview mode: <strong>{site.publishState || 'draft'}</strong>
        </span>
      </div>

      {mode === 'single' && <SinglePageRenderer site={site} />}
      {mode === 'multi' && <MultiPageRenderer site={site} navigation={navigation} />}
      {!['single', 'multi'].includes(mode) && (
        <div className="flex items-center justify-center h-64 bg-gray-50">
          <div className="text-center">
            <p className="text-red-500">Unknown rendering mode: {mode}</p>
          </div>
        </div>
      )}
    </div>
  )
}