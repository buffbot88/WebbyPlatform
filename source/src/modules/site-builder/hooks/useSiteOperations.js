import { useSite } from '../context/SiteContext'

// Hook for page operations
export function usePages() {
  const { site, addPage, removePage } = useSite()

  const pages = site?.pages || []

  const createPage = async (pageData) => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: pageData.name || 'New Page',
      sections: []
    }
    addPage(newPage)
    return newPage
  }

  const deletePage = async (pageId) => {
    removePage(pageId)
  }

  return {
    pages,
    createPage,
    deletePage
  }
}

// Hook for section operations
export function useSections() {
  const { site, addSection, removeSection, updateSite } = useSite()

  const addSectionToPage = async (pageId, sectionType) => {
    const newSection = {
      type: sectionType,
      id: `section-${Date.now()}`,
      // Default content based on type
      ...(sectionType === 'hero' && {
        title: 'Welcome to Our Site',
        subtitle: 'Build amazing websites with ease',
        buttonText: 'Get Started'
      }),
      ...(sectionType === 'text' && {
        title: 'Section Title',
        content: 'This is a text section. You can add your content here.'
      }),
      ...(sectionType === 'cta' && {
        title: 'Ready to Get Started?',
        subtitle: 'Join thousands of users building amazing websites.',
        primaryButton: 'Sign Up Free',
        secondaryButton: 'Learn More'
      })
    }
    addSection(pageId, newSection)
    return newSection
  }

  const removeSectionFromPage = async (pageId, sectionIndex) => {
    removeSection(pageId, sectionIndex)
  }

  const reorderSections = (pageId, newSections) => {
    const updatedPages = (site?.pages || []).map(p =>
      p.id === pageId ? { ...p, sections: newSections } : p
    )
    updateSite({ pages: updatedPages })
  }

  return {
    addSectionToPage,
    removeSectionFromPage,
    reorderSections
  }
}

// Hook for theme operations
// Granular hook for theme-only access
export function useTheme() {
  const { site, updateTheme } = useSite()

  const theme = site?.theme || {}

  const updateSiteTheme = async (themeUpdates) => {
    updateTheme(themeUpdates)
  }

  return {
    theme,
    updateTheme: updateSiteTheme
  }
}

// Hook for site mode
// Granular hook for mode-only access
export function useMode() {
  const { site, updateSite } = useSite()

  const mode = site?.mode || 'single'

  const setMode = async (newMode) => {
    if (newMode !== 'single' && newMode !== 'multi') {
      return
    }
    updateSite({ mode: newMode })
  }

  const toggleMode = async () => {
    const nextMode = mode === 'multi' ? 'single' : 'multi'
    updateSite({ mode: nextMode })
  }

  return {
    mode,
    setMode,
    toggleMode
  }
}

// Hook for publishing state
// Granular hook for publish-only access
export function usePublishing() {
  const { site, updatePublishState } = useSite()

  const publishState = site?.publishState || 'draft'

  const setPublishState = async (newState) => {
    if (newState !== 'draft' && newState !== 'published') {
      return
    }
    updatePublishState(newState)
  }

  const togglePublishState = async () => {
    const nextState = publishState === 'published' ? 'draft' : 'published'
    updatePublishState(nextState)
  }

  return {
    publishState,
    setPublishState,
    togglePublishState
  }
}

/**
 * PRIMARY HOOK for unified site settings control
 * Combines mode, publish state, and theme in a single hook
 * Recommended for components that manage multiple site configurations
 * All state flows through SiteContext
 */
export function useSiteSettings() {
  const { site, updateSite, updatePublishState, updateTheme } = useSite()

  const mode = site?.mode || 'single'
  const publishState = site?.publishState || 'draft'
  const theme = site?.theme || {}

  const setMode = async (newMode) => {
    if (newMode !== 'single' && newMode !== 'multi') {
      return
    }
    updateSite({ mode: newMode })
  }

  const setPublishState = async (newState) => {
    if (newState !== 'draft' && newState !== 'published') {
      return
    }
    updatePublishState(newState)
  }

  const togglePublishState = async () => {
    const nextState = publishState === 'published' ? 'draft' : 'published'
    updatePublishState(nextState)
  }

  const setPrimaryColor = async (color) => {
    updateTheme({ primaryColor: color })
  }

  const setFont = async (font) => {
    updateTheme({ font })
  }

  return {
    mode,
    setMode,
    publishState,
    setPublishState,
    togglePublishState,
    theme,
    setPrimaryColor,
    setFont
  }
}

// Hook for events
export function useEvents() {
  const { site, addEvent, removeEvent } = useSite()

  const events = site?.events || []

  const createEvent = async (eventData) => {
    const newEvent = {
      id: `event-${Date.now()}`,
      ...eventData
    }
    addEvent(newEvent)
    return newEvent
  }

  const deleteEvent = async (eventId) => {
    removeEvent(eventId)
  }

  return {
    events,
    createEvent,
    deleteEvent
  }
}