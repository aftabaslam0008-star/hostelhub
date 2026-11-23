import { Building2, Sparkles } from 'lucide-react'

export default function BrandLogo({ size = 'md', animated = true, showSubtitle = true }) {
  const isLarge = size === 'lg'
  const isSmall = size === 'sm'

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Animated Glowing Icon */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white shadow-lg transition-all ${
          isLarge
            ? 'h-14 w-14'
            : isSmall
            ? 'h-9 w-9'
            : 'h-11 w-11'
        } ${animated ? 'animate-brand-glow' : ''}`}
      >
        <Building2
          size={isLarge ? 28 : isSmall ? 18 : 22}
          className={`${animated ? 'animate-icon-float' : ''}`}
        />
        {/* Sparkle decorative pin */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-xs">
          <Sparkles size={8} className="animate-spin" style={{ animationDuration: '6s' }} />
        </span>
      </div>

      {/* Brand Text & Animated Subtitle */}
      <div>
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight leading-none ${
              isLarge
                ? 'text-2xl sm:text-3xl'
                : isSmall
                ? 'text-lg'
                : 'text-xl'
            } ${animated ? 'animate-shimmer-text' : 'text-slate-900 dark:text-white'}`}
          >
            HostelHub
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
        </div>

        {showSubtitle && (
          <div className="mt-1 flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 px-2 py-0.5 text-[10px] font-extrabold tracking-widest uppercase text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50">
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              Management Portal
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

