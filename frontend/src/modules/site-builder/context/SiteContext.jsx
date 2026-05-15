import React, { createContext, useContext, useReducer, useEffect } from 'react'
import siteData from '../../../data/site.json'

// Action types
const SITE_ACTIONS = {
  SET_SITE: 'SET_SITE',
  UPDATE_SITE: 'UPDATE_SITE',
  ADD_PAGE: 'ADD_PAGE',
  REMOVE_PAGE: 'REMOVE_PAGE',
  ADD_SECTION: 'ADD_SECTION',
  REMOVE_SECTION: 'REMOVE_SECTION',
  UPDATE_THEME: 'UPDATE_THEME',
  UPDATE_PUBLISH_STATE: 'UPDATE_PUBLISH_STATE',
  UPDATE_MODE: 'UPDATE_MODE',
  ADD_EVENT: 'ADD_EVENT',
  REMOVE_EVENT: 'REMOVE_EVENT'
}

// Initial state
const initialState = {
  site: null,
  loading: true,
  error: null
}

// Reducer
function siteReducer(state, action) {
  switch (action.type) {
    case SITE_ACTIONS.SET_SITE:
      return {
        ...state,
        site: action.payload,
        loading: false,
        error: null
      }
    case SITE_ACTIONS.UPDATE_SITE:
      return {
        ...state,
        site: { ...state.site, ...action.payload }
      }
    case SITE_ACTIONS.ADD_PAGE:
      return {
        ...state,
        site: {
          ...state.site,
          pages: [...state.site.pages, action.payload]
        }
      }
    case SITE_ACTIONS.REMOVE_PAGE:
      return {
        ...state,
        site: {
          ...state.site,
          pages: state.site.pages.filter(page => page.id !== action.payload)
        }
      }
    case SITE_ACTIONS.ADD_SECTION:
      return {
        ...state,
        site: {
          ...state.site,
          pages: state.site.pages.map(page =>
            page.id === action.payload.pageId
              ? { ...page, sections: [...page.sections, action.payload.section] }
              : page
          )
        }
      }
    case SITE_ACTIONS.REMOVE_SECTION:
      return {
        ...state,
        site: {
          ...state.site,
          pages: state.site.pages.map(page =>
            page.id === action.payload.pageId
              ? { ...page, sections: page.sections.filter((_, index) => index !== action.payload.sectionIndex) }
              : page
          )
        }
      }
    case SITE_ACTIONS.UPDATE_THEME:
      return {
        ...state,
        site: {
          ...state.site,
          theme: { ...state.site.theme, ...action.payload }
        }
      }
    case SITE_ACTIONS.UPDATE_PUBLISH_STATE:
      return {
        ...state,
        site: {
          ...state.site,
          publishState: action.payload
        }
      }
    case SITE_ACTIONS.UPDATE_MODE:
      return {
        ...state,
        site: {
          ...state.site,
          mode: action.payload
        }
      }
    case SITE_ACTIONS.ADD_EVENT:
      return {
        ...state,
        site: {
          ...state.site,
          events: [...state.site.events, action.payload]
        }
      }
    case SITE_ACTIONS.REMOVE_EVENT:
      return {
        ...state,
        site: {
          ...state.site,
          events: state.site.events.filter(event => event.id !== action.payload)
        }
      }
    default:
      return state
  }
}

// Context
const SiteContext = createContext()

// Provider component
export function SiteProvider({ children }) {
  const [state, dispatch] = useReducer(siteReducer, initialState)

  // Load site data on mount
  useEffect(() => {
    try {
      dispatch({ type: SITE_ACTIONS.SET_SITE, payload: siteData })
    } catch (error) {
      dispatch({ type: SITE_ACTIONS.SET_SITE, payload: null })
      console.error('Failed to load site data:', error)
    }
  }, [])

  // Actions
  const actions = {
    updateSite: (updates) => dispatch({ type: SITE_ACTIONS.UPDATE_SITE, payload: updates }),
    addPage: (page) => dispatch({ type: SITE_ACTIONS.ADD_PAGE, payload: page }),
    removePage: (pageId) => dispatch({ type: SITE_ACTIONS.REMOVE_PAGE, payload: pageId }),
    addSection: (pageId, section) => dispatch({ type: SITE_ACTIONS.ADD_SECTION, payload: { pageId, section } }),
    removeSection: (pageId, sectionIndex) => dispatch({ type: SITE_ACTIONS.REMOVE_SECTION, payload: { pageId, sectionIndex } }),
    updateTheme: (theme) => dispatch({ type: SITE_ACTIONS.UPDATE_THEME, payload: theme }),
    updatePublishState: (publishState) => dispatch({ type: SITE_ACTIONS.UPDATE_PUBLISH_STATE, payload: publishState }),
    updateMode: (mode) => dispatch({ type: SITE_ACTIONS.UPDATE_MODE, payload: mode }),
    addEvent: (event) => dispatch({ type: SITE_ACTIONS.ADD_EVENT, payload: event }),
    removeEvent: (eventId) => dispatch({ type: SITE_ACTIONS.REMOVE_EVENT, payload: eventId })
  }

  const value = {
    ...state,
    ...actions
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
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