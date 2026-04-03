import { NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * API key management endpoints
 * POST /api/keys - Save BYOK API key
 * GET /api/keys - Check if user has stored key
 * DELETE /api/keys - Remove stored API key
 */

/**
 * POST - Save a BYOK API key for authenticated user
 */
export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const { api_key } = await request.json();

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json(
        { error: 'api_key is required and must be a string' },
        { status: 400 }
      );
    }

    let encryptedKey;
    try {
      encryptedKey = encrypt(api_key);
    } catch (encryptError) {
      return NextResponse.json(
        { error: 'Failed to encrypt API key' },
        { status: 500 }
      );
    }

    const { error: upsertError } = await supabaseAdmin
      .from('user_api_keys')
      .upsert(
        {
          user_id: user.id,
          encrypted_key: encryptedKey,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ key_mode: 'byok' })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'API key saved successfully', key_mode: 'byok' },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if user has stored API key
 */
export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('key_mode')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('user_api_keys')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    const hasKey = !keyError && keyData !== null;

    return NextResponse.json(
      { has_key: hasKey, key_mode: profile.key_mode },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove stored API key
 */
export async function DELETE(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ key_mode: 'granted' })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'API key deleted successfully', key_mode: 'granted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
