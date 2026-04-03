import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Handle Supabase magic link callback
 * GET /api/auth/callback
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect to dashboard on success
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback exception:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
