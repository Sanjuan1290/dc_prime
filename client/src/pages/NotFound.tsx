import { Link, useNavigate } from "react-router-dom"

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-2xl border border-black bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-600">
          Error 404
        </p>

        <h1 className="mb-4 text-6xl font-bold md:text-8xl">404</h1>

        <h2 className="mb-3 text-2xl font-bold md:text-3xl">
          Page not found
        </h2>

        <p className="mx-auto mb-6 max-w-md text-gray-600">
          The page you are trying to open does not exist, was moved, or you do
          not have access to it.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="border border-black px-5 py-2 hover:bg-gray-200"
          >
            Go to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-black px-5 py-2 hover:bg-gray-200"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 border-t border-black pt-4 text-sm text-gray-500">
          D&C Prime Realty System
        </div>
      </section>
    </main>
  )
}

export default NotFound