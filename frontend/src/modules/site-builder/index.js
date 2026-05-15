// Main exports for the site-builder module

// Context - Single source of truth
export { SiteProvider, useSite } from './context/SiteContext'

// Services
export { SiteService } from './services/SiteService'
export { registerSection, getSectionComponent, SectionRenderer } from './services/SectionRegistry.jsx'
export { buildNavigation } from './services/NavigationBuilder'

// Hooks (Intent Layer) - All state flows through SiteContext
// Primary hooks (recommended for unified access):
//   - useSiteSettings() for combined mode/publish/theme control
// Granular hooks (for single-domain access):
//   - usePages(), useSections(), useTheme(), useMode(), usePublishing(), useEvents()
export { 
  usePages, 
  useSections, 
  useTheme, 
  useMode, 
  usePublishing, 
  useSiteSettings, 
  useEvents 
} from './hooks/useSiteOperations'

// Components (UI Layer) - Pure renderers
export { PageRenderer } from './components/PageRenderer'
export { SitePreview } from './components/SitePreview'
export { PageEditor } from './components/PageEditor'
export { SiteSettings } from './components/SiteSettings'

// Renderers (Display Layer)
export { SiteRenderer, SinglePageRenderer, MultiPageRenderer } from './renderers'