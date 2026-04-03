'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Loader2,
  Trash2,
  BarChart3,
} from 'lucide-react'
import ReleaseForm from '@/components/ReleaseForm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function EditRelease() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [release, setRelease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    if (!user || !params.id) return

    const loadRelease = async () => {
      try {
        const { data, error } = await supabase
          .from('releases')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Release not found')

        setRelease(data)
      } catch (err) {
        console.error('Failed to load release:', err)
        setError('Release not found or access denied')
      } finally {
        setLoading(false)
      }
    }

    loadRelease()
  }, [user, params.id])

  const handleUpdate = async (formData) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`/api/releases/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to update release')
    }

    const updated = await response.json()
    setRelease(updated)
    router.push('/dashboard')
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/releases/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete release')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to delete release')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b-2 border-[#1a1a1a] sticky top-0 z-40 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <h1 className="text-xl font-black uppercase tracking-widest text-[#fafaf9]">
              Marketing Plan
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#8a8a89] hover:text-[#fafaf9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-600/10 border border-rose-600/50 text-rose-600 text-xs uppercase tracking-wide font-semibold">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 text-rose-600 hover:text-rose-500"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          </div>
        ) : release ? (
          <div>
            <div className="mb-8">
              <div className="border-l-4 border-rose-600 pl-4">
                <h2 className="text-2xl font-black uppercase tracking-widest text-[#fafaf9]">
                  Edit Release
                </h2>
                <p className="text-xs uppercase tracking-widest text-[#8a8a89] mt-1">
                  {release.title}
                </p>
              </div>
            </div>

            {release.campaign_generated && (
              <div className="mb-6 px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-xs uppercase tracking-wide">
                <span className="text-rose-600 font-semibold">Note:</span>{' '}
                <span className="text-[#8a8a89]">
                  This release has an active campaign. Editing the title or date won't regenerate campaign content.
                </span>
              </div>
            )}

            <ReleaseForm
              initialData={release}
              onSubmit={handleUpdate}
              submitLabel="Save Changes"
              submittingLabel="Saving..."
              isEdit
            />

            <div className="mt-12 border-t-2 border-[#1a1a1a] pt-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#fafaf9] mb-4">
                Danger Zone
              </h3>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] text-rose-600 uppercase tracking-widest text-xs font-semibold border-2 border-[#2a2a2a] hover:border-rose-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Release
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="px-4 py-3 bg-rose-600/10 border border-rose-600/50 text-xs uppercase tracking-wide">
                    <p className="text-rose-600 font-semibold mb-1">
                      Are you sure?
                    </p>
                    <p className="text-[#8a8a89]">
                      This will permanently delete "{release.title}" and all its campaign data. This cannot be undone.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-4 py-3 bg-rose-600 text-[#0a0a0a] uppercase tracking-widest text-xs font-black border-2 border-rose-600 hover:bg-rose-700 hover:border-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Yes, Delete
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 px-4 py-3 bg-[#1a1a1a] text-[#fafaf9] uppercase tracking-widest text-xs font-semibold border-2 border-[#2a2a2a] hover:border-[#4a4a49] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#8a8a89] text-sm uppercase tracking-wide">
              Release not found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
