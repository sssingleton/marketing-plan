'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'
import { generateSlotDefs, CAMPAIGN_GOALS } from '@/lib/campaign-logic'
import {
  ChevronRight,
  Loader2,
  Music2,
  ArrowLeft,
  Settings,
  Shield,
  LogOut,
  BarChart3,
  Pencil,
  Trash2,
} from 'lucide-react'
import DayStrip from '@/components/DayStrip'
import PlatformCard from '@/components/PlatformCard'
import GoalPicker from '@/components/GoalPicker'
import ProgressBar from '@/components/ProgressBar'
import ReleaseForm from '@/components/ReleaseForm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Dashboard() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [releases, setReleases] = useState([])
  const [selectedRelease, setSelectedRelease] = useState(null)
  const [campaignSlots, setCampaignSlots] = useState([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [error, setError] = useState('')

  // Protect route
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Load releases
  useEffect(() => {
    if (!user) return

    const loadReleases = async () => {
      try {
        const { data, error } = await supabase
          .from('releases')
          .select('*')
          .eq('user_id', user.id)
          .order('release_date', { ascending: false })

        if (error) throw error
        setReleases(data || [])
      } catch (err) {
        console.error('Failed to load releases:', err)
        setError('Failed to load releases')
      } finally {
        setLoading(false)
      }
    }

    loadReleases()
  }, [user])

  // Load campaign slots when release is selected
  useEffect(() => {
    if (!selectedRelease) return

    const loadSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_slots')
          .select('*')
          .eq('release_id', selectedRelease.id)
          .order('day_offset', { ascending: true })

        if (error) throw error
        setCampaignSlots(data || [])
      } catch (err) {
        console.error('Failed to load campaign slots:', err)
      }
    }

    loadSlots()
  }, [selectedRelease])

  const handleCreateRelease = async (formData) => {
    const { data, error: insertError } = await supabase
      .from('releases')
      .insert([
        {
          user_id: user.id,
          title: formData.title,
          release_type: formData.release_type,
          release_date: formData.release_date,
          campaign_generated: false,
        },
      ])
      .select()

    if (insertError) throw insertError

    setReleases([data[0], ...releases])
  }

  const handleGenerateCampaign = async (goalId) => {
    setShowGoalPicker(false)
    setGenerating(true)
    setGenerationProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Generate all 87 slot definitions
      const slotDefs = generateSlotDefs()
      const BATCH_SIZE = 15
      const allResults = []

      for (let i = 0; i < slotDefs.length; i += BATCH_SIZE) {
        const batch = slotDefs.slice(i, i + BATCH_SIZE)

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            slots: batch,
            artist_name: profile?.display_name || user?.user_metadata?.display_name || 'Artist',
            archetype: profile?.artist_archetype || 'The Creator',
            release_title: selectedRelease.title,
            campaign_goal: goalId,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Generation failed')
        }

        const result = await response.json()
        allResults.push(...result.slots)

        // Update progress
        setGenerationProgress(Math.round(((i + batch.length) / slotDefs.length) * 90))
      }

      // Save slots to Supabase
      const slotsToInsert = allResults.map(slot => ({
        release_id: selectedRelease.id,
        day_offset: slot.day,
        platform: slot.platform,
        content_type: slot.content_type,
        prompt: slot.prompt,
        status: 'Placeholder',
      }))

      const { error: insertError } = await supabase
        .from('campaign_slots')
        .insert(slotsToInsert)

      if (insertError) throw insertError

      // Update release to mark campaign as generated
      await supabase
        .from('releases')
        .update({ campaign_generated: true, campaign_goal: goalId })
        .eq('id', selectedRelease.id)

      // Reload slots
      const { data: newSlots } = await supabase
        .from('campaign_slots')
        .select('*')
        .eq('release_id', selectedRelease.id)
        .order('day_offset', { ascending: true })

      setCampaignSlots(newSlots || [])
      setSelectedRelease({ ...selectedRelease, campaign_generated: true, campaign_goal: goalId })
      setGenerationProgress(100)
    } catch (err) {
      setError('Failed to generate campaign: ' + err.message)
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handleStatusChange = async (slotId, newStatus) => {
    try {
      await supabase
        .from('campaign_slots')
        .update({ status: newStatus })
        .eq('id', slotId)

      setCampaignSlots(
        campaignSlots.map(slot =>
          slot.id === slotId ? { ...slot, status: newStatus } : slot
        )
      )
    } catch (err) {
      setError('Failed to update status')
      console.error(err)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleDeleteRelease = async (releaseId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/releases/${releaseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')

      setReleases(releases.filter(r => r.id !== releaseId))
      if (selectedRelease?.id === releaseId) {
        setSelectedRelease(null)
      }
    } catch (err) {
      setError('Failed to delete release')
      console.error(err)
    }
  }

  // Render states
  const isLoading = loading || !user
  const hasReleases = releases.length > 0
  const hasCampaign = selectedRelease?.campaign_generated

  const currentDaySlots = campaignSlots.filter(s => s.day_offset === selectedDay)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Nav Bar */}
      <nav className="border-b-2 border-[#1a1a1a] sticky top-0 z-40 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <h1 className="text-xl font-black uppercase tracking-widest text-[#fafaf9]">
              Marketing Plan
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs text-[#8a8a89]">{user?.email}</span>
            <a
              href="/settings"
              className="p-2 hover:bg-[#1a1a1a] transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-[#8a8a89] hover:text-[#fafaf9]" />
            </a>
            {profile?.is_admin && (
              <a
                href="/admin"
                className="p-2 hover:bg-[#1a1a1a] transition-colors"
                title="Admin"
              >
                <Shield className="w-5 h-5 text-[#8a8a89] hover:text-[#fafaf9]" />
              </a>
            )}
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-[#1a1a1a] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-[#8a8a89] hover:text-rose-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          </div>
        ) : hasCampaign && selectedRelease ? (
          // Campaign Board View
          <div>
            <button
              onClick={() => setSelectedRelease(null)}
              className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#8a8a89] hover:text-[#fafaf9] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Releases
            </button>

            <div className="mb-8">
              <div className="border-l-4 border-rose-600 pl-4">
                <h2 className="text-2xl font-black uppercase tracking-widest text-[#fafaf9]">
                  {selectedRelease.title}
                </h2>
                <p className="text-xs uppercase tracking-widest text-[#8a8a89] mt-1">
                  {selectedRelease.release_type} • {selectedRelease.campaign_goal?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Progress overview */}
            <div className="mb-6">
              <ProgressBar
                progress={
                  campaignSlots.length > 0
                    ? (campaignSlots.filter(s => s.status === 'Posted').length / campaignSlots.length) * 100
                    : 0
                }
              />
            </div>

            {/* Day Strip */}
            <div className="mb-8 overflow-x-auto pb-4">
              <DayStrip selectedDay={selectedDay} onSelectDay={setSelectedDay} slots={campaignSlots} />
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentDaySlots.length > 0 ? (
                currentDaySlots.map(slot => (
                  <PlatformCard
                    key={slot.id}
                    slot={slot}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <div className="col-span-3 px-4 py-8 border-2 border-[#1a1a1a] text-center">
                  <p className="text-xs uppercase tracking-widest text-[#8a8a89]">
                    No content scheduled for this day
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : hasReleases ? (
          // Release List View
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-[#fafaf9] mb-8">
              Your Releases
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {releases.map(release => (
                <div
                  key={release.id}
                  className="border-2 border-[#1a1a1a] p-6 hover:border-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-wide text-[#fafaf9]">
                        {release.title}
                      </h3>
                      <p className="text-xs uppercase tracking-widest text-[#8a8a89] mt-1">
                        {release.release_type} • {new Date(release.release_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/releases/${release.id}/edit`)}
                        className="p-2 hover:bg-[#1a1a1a] transition-colors"
                        title="Edit release"
                      >
                        <Pencil className="w-4 h-4 text-[#8a8a89] hover:text-[#fafaf9]" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${release.title}" and all its campaign data?`)) {
                            handleDeleteRelease(release.id)
                          }
                        }}
                        className="p-2 hover:bg-[#1a1a1a] transition-colors"
                        title="Delete release"
                      >
                        <Trash2 className="w-4 h-4 text-[#8a8a89] hover:text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-[#1a1a1a] text-center">
                    <p className="text-xs uppercase tracking-widest">
                      {release.campaign_generated ? (
                        <span className="text-rose-600 font-semibold">Campaign Active</span>
                      ) : (
                        <span className="text-[#8a8a89]">No Campaign</span>
                      )}
                    </p>
                  </div>

                  {release.campaign_generated ? (
                    <button
                      onClick={() => setSelectedRelease(release)}
                      className="w-full px-4 py-2 bg-[#1a1a1a] text-[#fafaf9] uppercase tracking-widest text-xs font-semibold border-2 border-[#2a2a2a] hover:border-rose-600 hover:text-rose-600 transition-colors flex items-center justify-center gap-2"
                    >
                      View Campaign
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRelease(release)
                        setShowGoalPicker(true)
                      }}
                      className="w-full px-4 py-2 bg-rose-600 text-[#0a0a0a] uppercase tracking-widest text-xs font-black border-2 border-rose-600 hover:bg-[#0a0a0a] hover:text-rose-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Generate Marketing Plan
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create Release Form */}
            <div className="mt-12 border-t-2 border-[#1a1a1a] pt-12">
              <h3 className="text-lg font-black uppercase tracking-widest text-[#fafaf9] mb-6">
                Create New Release
              </h3>

              <div className="max-w-md">
                <ReleaseForm
                  onSubmit={handleCreateRelease}
                  submitLabel="Add Release"
                  submittingLabel="Creating..."
                />
              </div>
            </div>
          </div>
        ) : (
          // No Releases State
          <div className="text-center py-16">
            <Music2 className="w-12 h-12 text-[#2a2a2a] mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-[#fafaf9] mb-4">
              No Releases Yet
            </h3>
            <p className="text-[#8a8a89] text-sm uppercase tracking-wide mb-8">
              Create your first release to generate a marketing plan
            </p>

            <div className="max-w-md mx-auto">
              <ReleaseForm
                onSubmit={handleCreateRelease}
                submitLabel="Create Release"
                submittingLabel="Creating..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Goal Picker Modal */}
      {showGoalPicker && (
        <GoalPicker
          goals={CAMPAIGN_GOALS}
          isGenerating={generating}
          generationProgress={generationProgress}
          onSelectGoal={handleGenerateCampaign}
          onClose={() => setShowGoalPicker(false)}
        />
      )}
    </div>
  )
}
