import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">WebbyPlatform</h2>
        </div>
        <nav className="mt-4">
          <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
            Dashboard
          </Link>
          <Link to="/editor" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
            Editor
          </Link>
          <Link to="/preview" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
            Preview
          </Link>
          <Link to="/debug" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
            Audit Debugger
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">Site Builder</h1>
          <div className="space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Preview
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Publish
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}