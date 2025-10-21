function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Simple square block wordmark */}
          <div className="w-6 h-6 bg-black flex-shrink-0"></div>
          <div>
            <h1 className="text-base font-medium text-black">Seira</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 ml-9">
          Premium sports & entertainment, booked simply.
        </p>
      </header>

      {/* Main content - centered form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-4"
          >
            {/* Visually hidden label for accessibility */}
            <label htmlFor="search-input" className="sr-only">
              Describe your ideal experience
            </label>

            {/* Input and button container */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="search-input"
                type="text"
                placeholder='Describe your ideal experience… (e.g., "Lakers game in LA, nice hotel")'
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[44px]"
              />
              <button
                type="submit"
                aria-label="Submit your experience request"
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 min-h-[44px] whitespace-nowrap"
              >
                Submit
              </button>
            </div>

            {/* Helper text */}
            <p className="text-sm text-gray-600">
              Type once. We'll propose one complete plan.
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-6 text-center">
        <p className="text-xs text-gray-400">Demo only — mock data</p>
      </footer>
    </div>
  );
}

export default App;
