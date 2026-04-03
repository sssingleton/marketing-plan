'use client'

const DAYS = Array.from({ length: 29 }, (_, i) => i - 14)

export default function DayStrip({ selectedDay, onSelectDay, slots = [] }) {
  return (
    <div className="flex gap-1">
      {DAYS.map(day => {
        const isSelected = selectedDay === day
        const isRelease = day === 0
        const daySlots = slots.filter(s => s.day_offset === day)
        const allPosted = daySlots.length > 0 && daySlots.every(s => s.status === 'Posted')
        const hasApproved = daySlots.some(s => s.status === 'Approved')

        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={`flex-shrink-0 flex flex-col items-center px-2 py-2.5 min-w-[44px] border-b-2 transition-all text-xs font-bold uppercase tracking-widest ${
              isSelected
                ? 'border-rose-600 text-[#fafaf9] bg-rose-600/5'
                : 'border-transparent text-[#6a6a69] hover:text-[#fafaf9] hover:bg-[#1a1a1a]'
            }`}
          >
            <span className={isRelease ? 'font-black text-rose-600' : ''}>
              {isRelease ? 'REL' : day > 0 ? `+${day}` : day}
            </span>
            {allPosted && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
            )}
            {!allPosted && hasApproved && (
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1" />
            )}
          </button>
        )
      })}
    </div>
  )
}
