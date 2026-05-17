import { registerSection } from '../services/SectionRegistry.jsx'

export function CTASection({ section }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
          {section.title || 'Ready to Get Started?'}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {section.subtitle || 'Join thousands of users building amazing websites.'}
        </p>
        <div className="space-x-4">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            {section.primaryButton || 'Sign Up Free'}
          </button>
          <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            {section.secondaryButton || 'Learn More'}
          </button>
        </div>
      </div>
    </section>
  )
}

registerSection('cta', CTASection)