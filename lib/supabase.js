import { createClient } from '@supabase/supabase-js'

// Public client for browser-side operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Admin client for server-side operations only
// Lazy-initialized to avoid errors when service role key isn't available (browser)
let _supabaseAdmin = null
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
  }
  return _supabaseAdmin
}
