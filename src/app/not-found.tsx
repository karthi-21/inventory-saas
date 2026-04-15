export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <p className="mt-2 text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}