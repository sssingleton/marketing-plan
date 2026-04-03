'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'
import { Loader2, ArrowLeft, Shield } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Admin() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (!profile?.is_admin) {
      router.push('/dashboard')
    }
  }, [user, profile, router])

  useEffect(() => {
    if (!profile?.is_admin) return

    const loadUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to load users')

        const result = await response.json()
        setUsers(result.users || [])
      } catch (err) {
        console.error('Failed to load users:', err)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [profile])

  const handleKeyModeChange = async (userId, newMode) => {
    setUpdating(userId)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId, key_mode: newMode }),
      })

      if (!response.ok) throw new Error('Failed to update user')

      setUsers(
        users.map(u =>
          u.id === userId ? { ...u, key_mode: newMode } : u
        )
      )
      setSuccess(`User key mode updated to ${newMode}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update user')
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  if (!profile?.is_admin) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b-2 border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#8a8a89] hover:text-[#fafaf9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-12">
          <Shield className="w-6 h-6 text-rose-600" />
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#fafaf9]">
            Admin Panel
          </h1>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-600/10 border border-rose-600/50 text-rose-600 text-xs uppercase tracking-wide font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 px-4 py-3 bg-green-600/10 border border-green-600/50 text-green-600 text-xs uppercase tracking-wide font-semibold">
            {success}
          </div>
        )}

        <div>
          <div className="border-l-4 border-rose-600 pl-4 mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-[#fafaf9]">
              User Management
            </h2>
          </div>

          <div className="overflow-x-auto border-2 border-[#1a1a1a]">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1a1a1a] bg-[#1a1a1a]">
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-widest font-black text-[#fafaf9]">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-widest font-black text-[#fafaf9]">
                    API Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-widest font-black text-[#fafaf9]">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-widest font-black text-[#fafaf9]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b-2 border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-[#fafaf9]">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs uppercase tracking-widest font-semibold border-2 ${
                          u.key_mode === 'granted'
                            ? 'bg-rose-600/10 border-rose-600/50 text-rose-600'
                            : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#8a8a89]'
                        }`}
                      >
                        {u.key_mode === 'granted' ? 'Cake Records Key' : 'BYOK'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8a8a89]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.key_mode}
                        onChange={(e) => handleKeyModeChange(u.id, e.target.value)}
                        disabled={updating === u.id}
                        className="px-3 py-2 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] text-xs uppercase tracking-widest font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <option value="granted">Granted</option>
                        <option value="byok">BYOK</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs text-[#8a8a89] uppercase tracking-widest">
            Total Users: {users.length}
          </p>
        </div>
      </div>
    </div>
  )
}
