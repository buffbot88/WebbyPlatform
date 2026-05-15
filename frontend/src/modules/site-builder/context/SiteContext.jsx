import React, { createContext, useContext } from 'react'
import { PlatformCoreProvider, usePlatformCore } from '../../../core/platform'
import { CORE_ACTION_TYPES, createPlatformAction } from '../../../core/platform/actions'

// Context
const SiteContext = createContext()

function SiteBridge({ children }) {
  const { currentUserId, currentSiteId, sites, dispatchPlatformAction } = usePlatformCore()
  const site = sites?.find(siteItem => siteItem.id === currentSiteId) || null

  const actions = {
    updateSite: (updates) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.SITE_UPDATE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: updates
        })
      ),
    addPage: (page) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.PAGE_CREATE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: page
        })
      ),
    removePage: (pageId) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.PAGE_REMOVE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { pageId }
        })
      ),
    addSection: (pageId, section) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.SECTION_ADD,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { pageId, section }
        })
      ),
    removeSection: (pageId, sectionIndex) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.SECTION_REMOVE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { pageId, sectionIndex }
        })
      ),
    updateTheme: (theme) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.THEME_CHANGE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: theme
        })
      ),
    updatePublishState: (publishState) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.PUBLISH_STATE_UPDATE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { publishState }
        })
      ),
    updateMode: (mode) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.MODE_UPDATE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { mode }
        })
      ),
    addEvent: (event) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.EVENT_ADD,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: event
        })
      ),
    removeEvent: (eventId) =>
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.EVENT_REMOVE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { eventId }
        })
      )
  }

  const value = {
    site,
    loading: !site,
    error: site ? null : `Site '${currentSiteId}' not found in Platform Core`,
    ...actions
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

// Provider component
export function SiteProvider({ children }) {
  return (
    <PlatformCoreProvider>
      <SiteBridge>{children}</SiteBridge>
    </PlatformCoreProvider>
  )
}

// Hook to use site context
export function useSite() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider')
  }
  return context
}
