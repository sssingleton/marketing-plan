'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { BarChart3 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signInWithMagicLink(email)

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send magic link')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-transparent to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-600/10 blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(#1a1a1a_1px,transparent_1px),linear-gradient(90deg,#1a1a1a_1px,transparent_1px)] bg-[size:50px_50px] opacity-10"></div>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <BarChart3 className="w-12 h-12 text-rose-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-widest mb-4 text-[#fafaf9]">
              Marketing Plan
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#a8a8a7] mb-2">
              by The Cake Records
            </p>
            <p className="text-sm text-[#8a8a89] leading-relaxed">
              AI-powered 8-week social media marketing plans for your next release.
            </p>
          </div>

          {/* Form or Success State */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-[#2a2a2a] text-[#fafaf9] placeholder-[#6a6a69] uppercase tracking-wider text-sm font-semibold focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="px-4 py-2 bg-rose-600/10 border border-rose-600/50 text-rose-600 text-xs uppercase tracking-wide font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-rose-600 text-[#0a0a0a] uppercase tracking-widest text-xs font-black border-2 border-rose-600 hover:bg-[#0a0a0a] hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="px-4 py-4 bg-[#1a1a1a] border-2 border-rose-600/30">
                <p className="text-xs uppercase tracking-widest font-semibold text-rose-600">
                  Check your email
                </p>
                <p className="text-xs text-[#8a8a89] mt-2">
                  We've sent a login link. Click it to access your marketing plans.
                </p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full px-4 py-2 text-xs uppercase tracking-widest font-semibold text-[#8a8a89] hover:text-[#fafaf9] border-b-2 border-[#2a2a2a] hover:border-[#4a4a49] transition-colors"
              >
                Try another email
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 text-center text-xs text-[#6a6a69] uppercase tracking-wider">
            <p>No account needed. Magic links work once.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
