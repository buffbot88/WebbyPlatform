export function buildNavigation(site) {
  if (!site || !Array.isArray(site.pages)) {
    return []
  }

  return site.pages.map((page) => ({
    id: page.id,
    name: page.name || 'Untitled Page'
  }))
}
