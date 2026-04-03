'use client'

import { useState } from 'react'
import { Plus, Save, Loader2 } from 'lucide-react'

const RELEASE_TYPES = [
  { value: 'Single', label: 'Single' },
  { value: 'EP', label: 'EP' },
  { value: 'Album', label: 'Album' },
  { value: 'Mixtape', label: 'Mixtape' },
]

export default function ReleaseForm({
  initialData = {},
  onSubmit,
  submitLabel = 'Create Release',
  submittingLabel = 'Creating...',
  isEdit = false,
}) {
  const [title, setTitle] = useState(initialData.title || '')
  const [releaseDate, setReleaseDate] = useState(initialData.release_date || '')
  const [releaseType, setReleaseType] = useState(initialData.release_type || 'Single')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await onSubmit({
        title,
        release_type: releaseType,
        release_date: releaseDate,
      })

      // Only reset form on create, not edit
      if (!isEdit) {
        setTitle('')
        setReleaseDate('')
        setReleaseType('Single')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-2 bg-rose-600/10 border border-rose-600/50 text-rose-600 text-xs uppercase tracking-wide font-semibold">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-4 text-rose-600 hover:text-rose-500"
          >
            ✕
          </button>
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Release Title"
        required
        disabled={submitting}
        className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] placeholder-[#6a6a69] uppercase tracking-wider text-sm font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
      />

      <input
        type="date"
        value={releaseDate}
        onChange={(e) => setReleaseDate(e.target.value)}
        required
        disabled={submitting}
        className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] uppercase tracking-wider text-sm font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
      />

      <select
        value={releaseType}
        onChange={(e) => setReleaseType(e.target.value)}
        disabled={submitting}
        className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] uppercase tracking-wider text-sm font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
      >
        {RELEASE_TYPES.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 bg-rose-600 text-[#0a0a0a] uppercase tracking-widest text-xs font-black border-2 border-rose-600 hover:bg-[#0a0a0a] hover:text-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {submittingLabel}
          </>
        ) : (
          <>
            {isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {submitLabel}
          </>
        )}
      </button>
    </form>
  )
}
