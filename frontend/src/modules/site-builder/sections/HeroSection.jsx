import { registerSection } from '../services/SectionRegistry.jsx'

export function HeroSection({ section }) {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {section.title || 'Welcome to Our Site'}
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          {section.subtitle || 'Build amazing websites with ease'}
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          {section.buttonText || 'Get Started'}
        </button>
      </div>
    </section>
  )
}

registerSection('hero', HeroSection)