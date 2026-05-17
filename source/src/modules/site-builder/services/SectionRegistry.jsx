// Section registry - maps section types to components
const sectionRegistry = new Map()

// Register a section component
export function registerSection(type, component) {
  sectionRegistry.set(type, component)
}

// Get a section component by type
export function getSectionComponent(type) {
  return sectionRegistry.get(type) || DefaultSection
}

// Default section component for unknown types
function DefaultSection({ section }) {
  return (
    <div className="p-4 bg-gray-100 rounded border-2 border-dashed border-gray-300">
      <p className="text-gray-500">Unknown section type: {section.type}</p>
    </div>
  )
}

// Section renderer component
export function SectionRenderer({ section }) {
  const Component = getSectionComponent(section.type)
  return <Component section={section} />
}