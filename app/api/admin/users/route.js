import { NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

/**
 * Admin endpoints for managing users
 */

async function verifyAdmin(token) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!token || !token.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Authorization required' };
  }

  const tokenString = token.substring(7);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(tokenString);

  if (authError || !user) {
    return { isAdmin: false, error: 'Invalid authorization token' };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return { isAdmin: false, error: 'Admin access required', userId: user.id };
  }

  return { isAdmin: true, userId: user.id };
}

export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    const { isAdmin, error } = await verifyAdmin(authHeader);

    if (!isAdmin) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, key_mode, is_admin, created_at, updated_at');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const { data: keyStats } = await supabaseAdmin
      .from('user_api_keys')
      .select('user_id', { count: 'exact' });

    const usersWithKeys = new Set(keyStats?.map((k) => k.user_id) || []);

    const users = profiles.map((profile) => ({
      ...profile,
      has_stored_key: usersWithKeys.has(profile.id),
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    const { isAdmin, error } = await verifyAdmin(authHeader);

    if (!isAdmin) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { user_id, key_mode } = await request.json();

    if (!user_id || !key_mode) {
      return NextResponse.json(
        { error: 'user_id and key_mode are required' },
        { status: 400 }
      );
    }

    if (!['granted', 'byok'].includes(key_mode)) {
      return NextResponse.json(
        { error: 'key_mode must be either "granted" or "byok"' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ key_mode })
      .eq('id', user_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    if (key_mode === 'granted') {
      await supabaseAdmin.from('user_api_keys').delete().eq('user_id', user_id);
    }

    return NextResponse.json(
      { message: `User key_mode updated to ${key_mode}`, user_id, key_mode },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/admin/users error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
