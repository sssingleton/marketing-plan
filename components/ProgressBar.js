'use client'

export default function ProgressBar({ progress = 0 }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8a8a89]">
          Progress
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full bg-rose-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
