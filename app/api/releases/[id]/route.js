import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

// Helper to extract user from auth header
async function getUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/releases/[id]
export async function GET(request, { params }) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PATCH /api/releases/[id]
export async function PATCH(request, { params }) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const supabase = getSupabaseAdmin()

  const allowedFields = ['title', 'release_type', 'release_date']
  const updates = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('releases')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('releases')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update release' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/releases/[id]
export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  // Verify ownership
  const { data: existing } = await supabase
    .from('releases')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 })
  }

  // Delete campaign slots first (foreign key)
  await supabase
    .from('campaign_slots')
    .delete()
    .eq('release_id', id)

  // Delete the release
  const { error } = await supabase
    .from('releases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete release' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
