import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/encryption';

const MAX_SLOTS_PER_REQUEST = 100;
const BATCH_SIZE = 5;

/**
 * Generate campaign content using Claude API
 * POST /api/generate
 */
export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const {
      slots,
      artist_name,
      archetype,
      release_title,
      campaign_goal,
      api_key: byokApiKey,
    } = body;

    // Validate inputs
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: 'slots array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (slots.length > MAX_SLOTS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_SLOTS_PER_REQUEST} slots per request` },
        { status: 400 }
      );
    }

    if (!artist_name || !archetype || !release_title || !campaign_goal) {
      return NextResponse.json(
        {
          error:
            'artist_name, archetype, release_title, and campaign_goal are required',
        },
        { status: 400 }
      );
    }

    // Determine which API key to use
    let anthropicApiKey = byokApiKey;

    if (!byokApiKey) {
      // User didn't provide API key, check authorization
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization required' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);

      // Verify token and get user
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

      // Get user profile to check key_mode
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

      if (profile.key_mode === 'granted') {
        // Use server key from env
        anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          return NextResponse.json(
            { error: 'Server API key not configured' },
            { status: 500 }
          );
        }
      } else if (profile.key_mode === 'byok') {
        // Get user's stored encrypted key
        const { data: keyData, error: keyError } = await supabaseAdmin
          .from('user_api_keys')
          .select('encrypted_key')
          .eq('user_id', user.id)
          .single();

        if (keyError || !keyData) {
          return NextResponse.json(
            { error: 'User API key not found' },
            { status: 404 }
          );
        }

        try {
          anthropicApiKey = decrypt(keyData.encrypted_key);
        } catch (decryptError) {
          return NextResponse.json(
            { error: 'Failed to decrypt user API key' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid key_mode configuration' },
          { status: 400 }
        );
      }
    }

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // System prompt for Claude
    const systemPrompt =
      'You are an elite music marketing strategist. Generate specific, actionable social media content ideas for artists. Be bold, creative, and platform-native. Never be generic.';

    // Process slots in parallel batches
    const results = [];
    for (let i = 0; i < slots.length; i += BATCH_SIZE) {
      const batch = slots.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map((slot) =>
        generateSlotContent(
          client,
          systemPrompt,
          slot,
          artist_name,
          archetype,
          release_title,
          campaign_goal
        )
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return NextResponse.json({ slots: results }, { status: 200 });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * Generate content for a single slot
 */
async function generateSlotContent(
  client,
  systemPrompt,
  slot,
  artist_name,
  archetype,
  release_title,
  campaign_goal
) {
  const { day, platform, content_type } = slot;

  try {
    // Validate slot
    if (day === undefined || !platform || !content_type) {
      return {
        day,
        platform,
        content_type,
        prompt: 'Error: Missing day, platform, or content_type',
        status: 'error',
      };
    }

    // Construct user prompt
    const userPrompt = `Generate a ${content_type} for ${platform} for the artist "${artist_name}" (archetype: ${archetype}).

Release: "${release_title}"
Campaign Goal: ${campaign_goal}
Day Offset: ${day} days from launch

Create specific, actionable content that's native to ${platform}. Include hashtags if appropriate. Make it bold and creative.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const generatedContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      day,
      platform,
      content_type,
      prompt: generatedContent,
      status: 'success',
    };
  } catch (error) {
    console.error(`Error generating slot (day: ${day}, platform: ${platform}):`, error);

    // Return fallback content on error
    return {
      day,
      platform,
      content_type,
      prompt: `[Fallback Content] Placeholder for ${platform} content on day ${day}. Please regenerate or edit manually.`,
      status: 'error',
    };
  }
}
