function App() {
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Search submitted')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black"></div>
          <span className="text-lg font-medium">Seira</span>
        </div>
      </header>

      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <form role="search" onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="search-input" className="sr-only">
                Describe your ideal experience
              </label>
              <input
                id="search-input"
                type="text"
                placeholder='Describe your ideal experience… (e.g., "Lakers game in LA, nice hotel")'
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 whitespace-nowrap"
              >
                Submit
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Type once. We'll propose one complete plan.
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 sm:p-6 text-center">
        <p className="text-xs text-gray-500">Demo only — mock data</p>
      </footer>
    </div>
  )
}

export default App
