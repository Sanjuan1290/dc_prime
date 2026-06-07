type LoadingStateProps = {
  label?: string
  message?: string
}

const LoadingState = ({ label, message = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm font-medium text-slate-500 shadow-sm">
        {label || message}
      </div>
    </div>
  )
}

export default LoadingState
