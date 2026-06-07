import { FiAlertCircle, FiArrowLeft, FiHome } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import Button from "../components/ui/Button"

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <FiAlertCircle className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Error 404
        </p>
        <h1 className="mt-2 text-5xl font-bold text-slate-900 md:text-7xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
          The page you are trying to open does not exist, was moved, or you do
          not have access to it.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/dashboard">
            <Button icon={<FiHome />} variant="primary">
              Go Dashboard
            </Button>
          </Link>
          <Button icon={<FiArrowLeft />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </section>
    </main>
  )
}

export default NotFound
