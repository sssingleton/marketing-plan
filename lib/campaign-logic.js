// Platform definitions
export const PLATFORMS = ['Instagram', 'TikTok', 'YouTube'];

// 28-day campaign timeline: day -14 to +14
export const DAYS = Array.from({ length: 29 }, (_, i) => i - 14);

// Campaign goals
export const CAMPAIGN_GOALS = [
  { id: 'discovery', name: 'Discovery', description: 'Maximize reach and new audience exposure' },
  { id: 'engagement', name: 'Engagement', description: 'Drive conversation and community interaction' },
  { id: 'conversion', name: 'Conversion', description: 'Direct fans to streaming and purchases' },
];

// Status colors with Tailwind classes
export const STATUS_COLORS = {
  Placeholder: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-200 text-gray-800',
  },
  Drafted: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    badge: 'bg-blue-200 text-blue-800',
  },
  Approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    badge: 'bg-green-200 text-green-800',
  },
  Posted: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    badge: 'bg-purple-200 text-purple-800',
  },
};

/**
 * Determine content type based on day offset and platform
 * @param {number} day - Day offset from release (-14 to +14)
 * @param {string} platform - Platform name (Instagram, TikTok, YouTube)
 * @returns {string} Content type
 */
export function getContentType(day, platform) {
  if (day === 0) return 'Full Production';
  if (day === -13 || day === 7) return 'Silence';
  if (Math.abs(day) === 14 || Math.abs(day) === 7) return 'World-Build Post';
  if (day < 0 && platform === 'TikTok') return 'Hook Clip';
  if (day > 0 && platform === 'Instagram') return 'Evidence Post';
  return 'BTS/Process';
}

/**
 * Generate all campaign slot definitions
 * @returns {Array} Array of {day, platform, content_type} objects (87 total slots)
 */
export function generateSlotDefs() {
  const slots = [];

  DAYS.forEach((day) => {
    PLATFORMS.forEach((platform) => {
      const content_type = getContentType(day, platform);
      slots.push({
        day,
        platform,
        content_type,
      });
    });
  });

  return slots;
}

/**
 * Build detailed prompt for Claude to generate social media content
 */
export function buildPrompt({
  artist_name,
  archetype,
  release_title,
  day_offset,
  platform,
  content_type,
  campaign_goal,
}) {
  const campaignGoalLabels = {
    discovery: 'Maximize reach and new audience exposure',
    engagement: 'Drive conversation and community interaction',
    conversion: 'Direct fans to streaming and purchases',
  };

  const goalLabel = campaignGoalLabels[campaign_goal] || 'Engage the audience';

  const platformGuidelines = {
    Instagram:
      'Instagram favors polished, high-quality visuals with thoughtful captions (1-2200 characters). Focus on beautiful, aspirational imagery that tells a story. Use 3-5 relevant hashtags. Optimal posting time: 6-9 AM or 5-11 PM.',
    TikTok:
      'TikTok thrives on authentic, trend-aware short-form video (15-60 seconds). Hook viewers in the first second. Use trending sounds and effects. Captions should be punchy and conversational. Optimal posting time: 6-10 AM or 7-11 PM.',
    YouTube:
      'YouTube values longer-form content (5+ minutes ideal for Shorts, full videos 10-20 minutes). Create narrative-driven, high-production value content. Include clear CTAs and engaging thumbnails. Optimal posting time: 2-4 PM or 8-11 PM.',
  };

  const dayContext = {
    '-14': 'Campaign launch 2 weeks before release. Build anticipation and awareness.',
    '-13': 'Complete silence - no posting. Let the buzz settle.',
    '-7': 'One week out. Increase intensity and create urgency.',
    '0': 'Release day. Maximum visibility and celebration.',
    '7': 'One week post-release. Share results and momentum.',
    '14': 'Campaign finale. Reflect on impact and thank supporters.',
  };

  const dayLabel =
    dayContext[day_offset.toString()] ||
    (day_offset < 0
      ? `${Math.abs(day_offset)} days before release`
      : `${day_offset} days after release`);

  const systemPrompt = `You are a social media strategist and content creator specializing in music promotion. Your role is to generate specific, actionable, and platform-optimized social media content ideas that drive engagement and sales.

You understand:
- Platform-specific best practices, algorithms, and audience behaviors
- The artist's unique voice and archetype
- How to balance audience growth with deepening fan connections
- How to create narrative momentum across a 28-day campaign
- How to adapt content across different platforms while maintaining brand consistency`;

  const userPrompt = `Create a social media post concept for the following campaign:

Artist/Creator: ${artist_name}
Archetype: ${archetype}
Release: "${release_title}"
Campaign Timeline: ${dayLabel} (Day ${day_offset})
Platform: ${platform}
Content Type: ${content_type}
Campaign Goal: ${goalLabel}

${platformGuidelines[platform]}

Requirements for this post:
1. Post Concept: A specific, creative idea that fits the content type and timeline
2. Caption: Complete, ready-to-post caption text (include any hashtags or CTAs appropriate to the platform)
3. Visual Direction: Detailed description of what imagery, video, or design should accompany this post
4. Posting Time: Specific recommended posting time
5. Hook/Angle: What makes this post unique and stopping power on the feed/timeline
6. Engagement Strategy: How to encourage interaction and what comments/replies you hope to spark

Format your response as a structured outline with these sections clearly labeled. Make the content specific to "${artist_name}" and "${release_title}" - avoid generic placeholder language. Think about what would genuinely excite fans and attract new listeners.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}
