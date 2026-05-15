import { useSite } from '../modules/site-builder/context/SiteContext'
import { usePages, useEvents, useTheme } from '../modules/site-builder/hooks/useSiteOperations'
import { SiteSettings } from '../modules/site-builder/components/SiteSettings'

export default function Dashboard() {
  const { site, loading } = useSite()
  const { pages } = usePages()
  const { events } = useEvents()

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p>Welcome to your website builder dashboard.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Pages</h3>
          <p>{pages.length} pages created</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Sections</h3>
          <p>{pages.reduce((total, page) => total + page.sections.length, 0)} sections added</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Events</h3>
          <p>{events.length} events scheduled</p>
        </div>
      </div>

      <div className="mt-8">
        <SiteSettings />
      </div>
    </div>
  )
}