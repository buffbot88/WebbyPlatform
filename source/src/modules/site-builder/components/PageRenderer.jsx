import { SectionRenderer } from '../services/SectionRegistry'

export function PageRenderer({ page }) {
  return (
    <div className="min-h-screen">
      {page.sections.map((section, index) => (
        <SectionRenderer key={`${section.id}-${index}`} section={section} />
      ))}
    </div>
  )
}