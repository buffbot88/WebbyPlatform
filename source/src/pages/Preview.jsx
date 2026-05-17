import { useSite } from '../modules/site-builder/context/SiteContext'
import { SiteRenderer } from '../modules/site-builder/renderers'

export default function Preview() {
  const { site, loading } = useSite()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading preview...</p>
      </div>
    )
  }

  return (
    <div className="site-preview">
      <SiteRenderer site={site} />
    </div>
  )
}