import { useState } from 'react'
import { useSite } from '../context/SiteContext'
import { usePages, useSections } from '../hooks/useSiteOperations'
import { SectionRenderer } from '../services/SectionRegistry.jsx'

export function PageEditor() {
  const { site } = useSite()
  const { pages, createPage, deletePage } = usePages()
  const { addSectionToPage, removeSectionFromPage } = useSections()
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id || null)
  const [showAddSection, setShowAddSection] = useState(false)

  const selectedPage = pages.find(page => page.id === selectedPageId)

  const handleAddPage = async () => {
    const pageName = prompt('Enter page name:')
    if (pageName) {
      const newPage = await createPage({ name: pageName })
      setSelectedPageId(newPage.id)
    }
  }

  const handleDeletePage = async (pageId) => {
    if (confirm('Are you sure you want to delete this page?')) {
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

  const handleRemoveSection = async (sectionIndex) => {
    if (selectedPageId) {
      await removeSectionFromPage(selectedPageId, sectionIndex)
    }
  }

  return (
    <div className="page-editor">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Page Editor</h2>
          <button
            onClick={handleAddPage}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Page
          </button>
        </div>

        {/* Page selector */}
        <div className="flex space-x-2 mb-4">
          {pages.map(page => (
            <div key={page.id} className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedPageId(page.id)}
                className={`px-4 py-2 rounded ${
                  selectedPageId === page.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page.name}
              </button>
              <button
                onClick={() => handleDeletePage(page.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedPage ? (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Section
            </button>
          </div>

          {showAddSection && (
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Choose section type:</h3>
              <div className="space-x-2">
                <button
                  onClick={() => handleAddSection('hero')}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Hero
                </button>
                <button
                  onClick={() => handleAddSection('text')}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  Text
                </button>
                <button
                  onClick={() => handleAddSection('cta')}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
                >
                  CTA
                </button>
              </div>
            </div>
          )}

          {/* Render sections */}
          <div className="space-y-4">
            {selectedPage.sections.map((section, index) => (
              <div key={`${section.id}-${index}`} className="relative">
                <SectionRenderer section={section} />
                <button
                  onClick={() => handleRemoveSection(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            {selectedPage.sections.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No sections yet. Click "Add Section" to get started.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No pages available. Create a page to start editing.
        </div>
      )}
    </div>
  )
}