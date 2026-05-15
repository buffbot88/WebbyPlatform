import { SectionRenderer } from '../services/SectionRegistry.jsx'

/**
 * SinglePageRenderer - Renders all pages as one continuous scrollable layout
 * All sections from all pages are flattened into a single render flow
 * No navigation menu is displayed
 */
export function SinglePageRenderer({ site }) {
  if (!site || !site.pages || site.pages.length === 0) {
    return <div className="text-center py-12 text-gray-500">No pages to display</div>
  }

  return (
    <div className="site-single-page-renderer">
      {site.pages.map((page) => (
        <div key={page.id} className="page-sections">
          {page.sections && page.sections.length > 0 ? (
            page.sections.map((section, index) => (
              <SectionRenderer key={`${page.id}-${section.id}-${index}`} section={section} />
            ))
          ) : (
            <div className="py-12 px-4 bg-gray-50 text-center text-gray-500">
              {/* Empty page - no visual indicator in single mode */}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}