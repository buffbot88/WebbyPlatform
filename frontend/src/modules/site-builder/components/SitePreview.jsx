import { useSite } from '../context/SiteContext'
import { SiteRenderer } from '../renderers'

export function SitePreview() {
  const { site, loading } = useSite()

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading preview...</div>
  }

  if (!site) {
    return <div className="flex items-center justify-center h-64">No site data available</div>
  }

  return (
    <div className="site-preview">
      <SiteRenderer site={site} />
    </div>
  )
}