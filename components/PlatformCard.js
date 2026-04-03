'use client'

import { Instagram, Youtube, Music2 } from 'lucide-react'

const PLATFORM_ICONS = {
  Instagram: Instagram,
  TikTok: Music2,
  YouTube: Youtube,
}

const STATUS_OPTIONS = ['Placeholder', 'Drafted', 'Approved', 'Posted']

const STATUS_STYLES = {
  Placeholder: 'text-[#6a6a69] border-[#2a2a2a]',
  Drafted: 'text-amber-500 border-amber-500/40 bg-amber-500/5',
  Approved: 'text-sky-500 border-sky-500/40 bg-sky-500/5',
  Posted: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/5',
}

export default function PlatformCard({ slot, onStatusChange }) {
  const Icon = PLATFORM_ICONS[slot.platform] || Music2

  return (
    <div className={`border-2 p-5 transition-colors ${
      slot.status !== 'Placeholder' ? 'border-[#2a2a2a]' : 'border-[#1a1a1a]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-black uppercase tracking-widest text-[#fafaf9]">
            {slot.platform}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6a6a69] border border-[#2a2a2a] px-2 py-0.5">
          {slot.content_type}
        </span>
      </div>

      {/* Content */}
      <div className="mb-4 min-h-[80px]">
        {slot.prompt ? (
          <p className="text-xs leading-relaxed text-[#c4c4c3]">
            {slot.prompt}
          </p>
        ) : (
          <p className="text-xs italic text-[#4a4a49]">
            No content generated
          </p>
        )}
      </div>

      {/* Status Selector */}
      <select
        value={slot.status}
        onChange={(e) => onStatusChange(slot.id, e.target.value)}
        className={`w-full px-3 py-2 text-xs font-bold uppercase tracking-widest border bg-transparent focus:outline-none focus:border-rose-600 transition-colors cursor-pointer ${STATUS_STYLES[slot.status]}`}
      >
        {STATUS_OPTIONS.map(status => (
          <option key={status} value={status} className="bg-[#0a0a0a] text-[#fafaf9]">
            {status}
          </option>
        ))}
      </select>
    </div>
  )
}
