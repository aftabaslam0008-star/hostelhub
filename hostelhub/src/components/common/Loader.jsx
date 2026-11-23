export default function Loader({ label = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-sm text-slate-600" role="status">
      <span
        className={`animate-spin rounded-full border-slate-200 border-t-blue-600 ${sizeClasses[size] || sizeClasses.md}`}
      />
      {label && <span className="text-slate-500 font-medium">{label}</span>}
    </div>
  )
}
