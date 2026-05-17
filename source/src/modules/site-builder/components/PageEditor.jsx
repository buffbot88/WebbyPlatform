import { useState, useRef } from 'react'
import { usePages, useSections } from '../hooks/useSiteOperations'
import { SectionRenderer } from '../services/SectionRegistry.jsx'

const SECTION_TYPES = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Full-width banner with headline and CTA button',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    color: 'bg-blue-100 text-blue-600'
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Content block with title and body text',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    color: 'bg-green-100 text-green-600'
  },
  {
    type: 'cta',
    label: 'CTA',
    description: 'Call-to-action with primary and secondary buttons',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    color: 'bg-purple-100 text-purple-600'
  }
]

const TEMPLATES = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean single hero section',
    preview: ['hero'],
    sections: [
      { type: 'hero', title: 'Welcome', subtitle: 'Simple. Clean. Fast.', buttonText: 'Get Started' }
    ]
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Hero, about section, and CTA',
    preview: ['hero', 'text', 'cta'],
    sections: [
      { type: 'hero', title: 'Grow Your Business', subtitle: 'The platform built for serious teams.', buttonText: 'Start Free Trial' },
      { type: 'text', title: 'About Us', content: 'We help businesses build beautiful websites faster. Our platform combines powerful tools with an intuitive interface.' },
      { type: 'cta', title: 'Ready to Get Started?', subtitle: 'Join thousands of teams already building with us.', primaryButton: 'Sign Up Free', secondaryButton: 'View Demo' }
    ]
  },
  {
    id: 'landing',
    label: 'Landing Page',
    description: 'Full landing with hero, two content sections, and CTA',
    preview: ['hero', 'text', 'text', 'cta'],
    sections: [
      { type: 'hero', title: 'Build Something Amazing', subtitle: 'Everything you need to launch your next big idea.', buttonText: 'Start Building' },
      { type: 'text', title: 'Powerful Features', content: 'Drag-and-drop editing, module marketplace, real-time preview, and team collaboration — all in one place.' },
      { type: 'text', title: 'Why Choose Us', content: 'Built for speed and reliability. Our platform scales with your needs from prototype to production.' },
      { type: 'cta', title: 'Launch Today', subtitle: 'No credit card required. Free forever for small sites.', primaryButton: 'Get Started Free', secondaryButton: 'See Pricing' }
    ]
  }
]

const TYPE_COLORS = {
  hero: 'bg-blue-100 text-blue-700',
  text: 'bg-green-100 text-green-700',
  cta: 'bg-purple-100 text-purple-700'
}

export function PageEditor() {
  const { pages, createPage, deletePage } = usePages()
  const { addSectionToPage, removeSectionFromPage, reorderSections } = useSections()
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id || null)
  const [view, setView] = useState('editor') // editor | templates | preview
  const [showAddSection, setShowAddSection] = useState(false)

  // Drag state
  const dragIndex = useRef(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const selectedPage = pages.find(p => p.id === selectedPageId)

  const handleAddPage = async () => {
    const pageName = prompt('Enter page name:')
    if (pageName?.trim()) {
      const newPage = await createPage({ name: pageName.trim() })
      setSelectedPageId(newPage.id)
    }
  }

  const handleDeletePage = async (pageId) => {
    if (confirm('Delete this page?')) {
      await deletePage(pageId)
      if (selectedPageId === pageId) {
        setSelectedPageId(pages.find(p => p.id !== pageId)?.id || null)
      }
    }
  }

  const handleAddSection = async (sectionType) => {
    if (selectedPageId) {
      await addSectionToPage(selectedPageId, sectionType)
      setShowAddSection(false)
    }
  }

  const handleRemoveSection = async (index) => {
    if (selectedPageId) await removeSectionFromPage(selectedPageId, index)
  }

  const handleApplyTemplate = (template) => {
    if (!selectedPageId) return
    const sections = template.sections.map((s, i) => ({
      ...s,
      id: `section-${Date.now()}-${i}`
    }))
    reorderSections(selectedPageId, sections)
    setView('editor')
  }

  // Drag handlers
  const handleDragStart = (e, index) => {
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(index)
  }
  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === dropIndex || !selectedPage) return
    const sections = [...selectedPage.sections]
    const [moved] = sections.splice(from, 1)
    sections.splice(dropIndex, 0, moved)
    reorderSections(selectedPageId, sections)
    dragIndex.current = null
    setDragOverIdx(null)
  }
  const handleDragEnd = () => {
    dragIndex.current = null
    setDragOverIdx(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Page Editor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Build your pages with sections and templates.</p>
        </div>
        <button
          onClick={handleAddPage}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>
      </div>

      {/* Page tabs */}
      {pages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {pages.map(page => (
            <div key={page.id} className="flex items-center flex-shrink-0">
              <button
                onClick={() => setSelectedPageId(page.id)}
                className={`px-4 py-2 rounded-l-lg text-sm font-medium transition-colors border ${
                  selectedPageId === page.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page.name}
              </button>
              <button
                onClick={() => handleDeletePage(page.id)}
                className={`px-2 py-2 rounded-r-lg text-sm border-t border-r border-b transition-colors ${
                  selectedPageId === page.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-400 hover:text-red-500'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:bg-gray-50'
                }`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedPage ? (
        <div className="space-y-4">
          {/* View switcher */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            {[
              { id: 'editor', label: 'Editor' },
              { id: 'templates', label: 'Templates' },
              { id: 'preview', label: 'Preview' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {selectedPage.sections.length} section{selectedPage.sections.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ── TEMPLATE GALLERY ── */}
          {view === 'templates' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Applying a template will replace all current sections on this page.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {TEMPLATES.map(tpl => (
                  <div key={tpl.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-4 space-y-1.5">
                      {tpl.preview.map((type, i) => (
                        <div
                          key={i}
                          className={`h-5 rounded text-xs font-medium flex items-center px-2 ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-500'}`}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                    <div className="px-4 pb-4">
                      <p className="font-semibold text-gray-900 text-sm">{tpl.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 mb-3">{tpl.description}</p>
                      <button
                        onClick={() => handleApplyTemplate(tpl)}
                        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                      >
                        Apply Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EDITOR ── */}
          {view === 'editor' && (
            <div className="space-y-3">
              {/* Add section */}
              <div>
                <button
                  onClick={() => setShowAddSection(v => !v)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all w-full justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Section
                </button>

                {showAddSection && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {SECTION_TYPES.map(st => (
                      <button
                        key={st.type}
                        onClick={() => handleAddSection(st.type)}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${st.color}`}>
                          {st.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{st.label}</p>
                          <p className="text-xs text-gray-500">{st.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Section list */}
              {selectedPage.sections.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">No sections yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add a section above or pick a template to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Drag sections to reorder
                  </p>
                  {selectedPage.sections.map((section, index) => {
                    const st = SECTION_TYPES.find(s => s.type === section.type)
                    return (
                      <div
                        key={`${section.id}-${index}`}
                        draggable
                        onDragStart={e => handleDragStart(e, index)}
                        onDragOver={e => handleDragOver(e, index)}
                        onDrop={e => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                          dragOverIdx === index
                            ? 'border-indigo-400 shadow-md scale-[1.01]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-gray-300 hover:text-gray-500 cursor-grab flex-shrink-0 px-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm8-16a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${st?.color || 'bg-gray-100 text-gray-500'}`}>
                          {st?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{st?.label || section.type}</span>
                            <span className="text-xs text-gray-400">#{index + 1}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {section.title || section.content || '—'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveSection(index)}
                          className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PREVIEW ── */}
          {view === 'preview' && (
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {selectedPage.sections.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No sections to preview.</div>
              ) : (
                selectedPage.sections.map((section, index) => (
                  <SectionRenderer key={`${section.id}-${index}`} section={section} />
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500 font-medium">No pages yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Create your first page to start building.</p>
          <button
            onClick={handleAddPage}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Page
          </button>
        </div>
      )}
    </div>
  )
}
