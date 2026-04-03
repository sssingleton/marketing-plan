'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'
import { Key, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Settings() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [archetype, setArchetype] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [removingKey, setRemovingKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          setProfile(data)
          setDisplayName(data.display_name || '')
          setArchetype(data.artist_archetype || '')
          setKeyStatus(data.key_mode)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          artist_archetype: archetype,
        })

      if (error) throw error

      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKey = async (e) => {
    e.preventDefault()
    setSavingKey(true)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      })

      if (!response.ok) {
        throw new Error('Failed to save API key')
      }

      setKeyStatus('byok')
      setApiKey('')
      setSuccess('API key saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save API key')
      console.error(err)
    } finally {
      setSavingKey(false)
    }
  }

  const handleRemoveApiKey = async () => {
    if (!confirm('Remove your API key? You\'ll revert to using Cake Records keys.')) {
      return
    }

    setRemovingKey(true)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/keys', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to remove API key')
      }

      setKeyStatus('granted')
      setApiKey('')
      setSuccess('API key removed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to remove API key')
      console.error(err)
    } finally {
      setRemovingKey(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b-2 border-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#8a8a89] hover:text-[#fafaf9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#fafaf9] mb-12">
          Settings
        </h1>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-600/10 border border-rose-600/50 text-rose-600 text-xs uppercase tracking-wide font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 px-4 py-3 bg-green-600/10 border border-green-600/50 text-green-600 text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* API Configuration */}
        <div className="mb-12">
          <div className="border-l-4 border-rose-600 pl-4 mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-[#fafaf9]">
              API Configuration
            </h2>
          </div>

          {keyStatus === 'granted' ? (
            <div className="bg-[#1a1a1a] border-2 border-[#2a2a2a] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#fafaf9] uppercase tracking-wide">
                    Using Cake Records API Key
                  </p>
                  <p className="text-xs text-[#8a8a89] uppercase tracking-widest mt-1">
                    No setup needed. You're good to go!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-[#8a8a89] mb-2">
                  Your API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  disabled={savingKey}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] placeholder-[#6a6a69] font-mono text-sm focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
                />
                <p className="mt-2 text-xs text-[#8a8a89]">
                  Get your key at{' '}
                  <a
                    href="https://console.anthropic.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:underline"
                  >
                    console.anthropic.com/keys
                  </a>
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={savingKey || !apiKey}
                  className="flex-1 px-4 py-3 bg-rose-600 text-[#0a0a0a] uppercase tracking-widest text-xs font-black border-2 border-rose-600 hover:bg-[#0a0a0a] hover:text-rose-600 transition-colors disabled:opacity-50"
                >
                  {savingKey ? 'Saving...' : 'Save Key'}
                </button>
              </div>
            </form>
          )}

          {keyStatus === 'byok' && (
            <div className="mt-4">
              <button
                onClick={handleRemoveApiKey}
                disabled={removingKey}
                className="px-4 py-2 text-xs uppercase tracking-widest font-semibold text-[#8a8a89] hover:text-rose-600 border-b-2 border-[#2a2a2a] hover:border-rose-600 transition-colors disabled:opacity-50"
              >
                {removingKey ? 'Removing...' : 'Remove Your Key'}
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div>
          <div className="border-l-4 border-rose-600 pl-4 mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-[#fafaf9]">
              Profile
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md">
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold text-[#8a8a89] mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Artist Name"
                disabled={saving}
                className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] placeholder-[#6a6a69] uppercase tracking-wider font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold text-[#8a8a89] mb-2">
                Artist Archetype
              </label>
              <input
                type="text"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                placeholder="e.g., The Architect, The Mystic, The Visionary"
                disabled={saving}
                className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] placeholder-[#6a6a69] uppercase tracking-wider font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-[#8a8a89]">
                Helps customize marketing strategy for your brand
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-3 bg-rose-600 text-[#0a0a0a] uppercase tracking-widest text-xs font-black border-2 border-rose-600 hover:bg-[#0a0a0a] hover:text-rose-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
