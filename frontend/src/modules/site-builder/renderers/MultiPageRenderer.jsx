import { useState } from 'react'
import { SectionRenderer } from '../services/SectionRegistry.jsx'
import { buildNavigation } from '../services/NavigationBuilder'

/**
 * MultiPageRenderer - Renders pages individually with auto-generated navigation
 * Navigation is displayed as a horizontal menu for page switching
 * Only the current page's sections are rendered
 */
export function MultiPageRenderer({ site, navigation }) {
  const navigationItems = navigation || buildNavigation(site)
  const [currentPageId, setCurrentPageId] = useState(navigationItems?.[0]?.id || null)

  if (!site || !site.pages || site.pages.length === 0) {
    return <div className="text-center py-12 text-gray-500">No pages to display</div>
  }

  const currentPage = site.pages.find((page) => page.id === currentPageId)

  // Find first valid page if current is deleted
  const validPageId = currentPage ? currentPageId : navigationItems?.[0]?.id
  const displayPage = site.pages.find((page) => page.id === validPageId)

  if (!displayPage) {
    return <div className="text-center py-12 text-gray-500">No page available</div>
  }

  return (
    <div className="site-multi-page-renderer">
      {/* Auto-generated Navigation Menu */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPageId(item.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  validPageId === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Current Page Sections */}
      <div className="page-content">
        {displayPage.sections && displayPage.sections.length > 0 ? (
          displayPage.sections.map((section, index) => (
            <SectionRenderer key={`${displayPage.id}-${section.id}-${index}`} section={section} />
          ))
        ) : (
          <div className="py-24 px-4 bg-gray-50 text-center text-gray-500">
            <p className="text-lg">No sections on this page yet</p>
          </div>
        )}
      </div>
    </div>
  )
}