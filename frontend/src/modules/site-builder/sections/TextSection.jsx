import { registerSection } from '../services/SectionRegistry.jsx'

export function TextSection({ section }) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
            {section.title || 'Section Title'}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {section.content || 'This is a text section. You can add your content here.'}
          </p>
        </div>
      </div>
    </section>
  )
}

registerSection('text', TextSection)