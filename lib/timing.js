// Seasonal and event timing for campaign suggestions.
//
// Weighting rule (Stuart, 2026-11-23): the artist's personality and overall
// content come FIRST. Timing is a SECONDARY factor. It can shape WHEN a post
// goes out and the ANGLE it takes, but it never overrides the artist's
// personality and never pushes off-brand content.
//
// Source list: Stuart's "Content Ideas Bank" doc
// (https://claude.ai/artifact/1tGQ95YoMWzfGFYnugX6vg). Add new moments here as
// that doc grows.

// How close a moment has to be to a post's date to be mentioned at all.
export const TIMING_WINDOW_DAYS = 7;

// Timed content gets built 4 to 6 weeks ahead so it's ready the day it hits.
export const BUILD_AHEAD_MIN_DAYS = 28;
export const BUILD_AHEAD_MAX_DAYS = 42;

// ---------- date helpers (all UTC, date-only) ----------

function utcDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day));
}

// nth weekday of a month. weekday: 0 = Sunday ... 6 = Saturday. n = 1..5
function nthWeekday(year, monthIndex, weekday, n) {
  const first = utcDate(year, monthIndex, 1);
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return utcDate(year, monthIndex, 1 + offset + (n - 1) * 7);
}

function lastWeekday(year, monthIndex, weekday) {
  const last = utcDate(year, monthIndex + 1, 0);
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return utcDate(year, monthIndex, last.getUTCDate() - offset);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return utcDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return null;
  return utcDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// ---------- the moments ----------

// Seasons: windows that repeat every year. month is 0-based; end is inclusive.
export const SEASONS = [
  { name: 'New Year', start: [0, 1], end: [0, 15], angle: 'fresh start, "edit your year" recaps, goal setups' },
  { name: "Valentine's", start: [1, 1], end: [1, 14], angle: 'warm, soft looks; gift ideas' },
  { name: 'Spring blooms', start: [2, 1], end: [3, 30], angle: 'pastel looks, flower shots around Nashville' },
  { name: 'Summer', start: [5, 1], end: [7, 31], angle: 'film looks, golden hour, road trips, lake days' },
  { name: 'Fall color', start: [9, 1], end: [10, 30], angle: 'warm tones, golden hour, leaf peeping, spooky looks for Halloween' },
  { name: 'Holiday lights', start: [10, 15], end: [11, 31], angle: 'night looks, bokeh, gift guides' },
  { name: 'Year-end recaps', start: [11, 1], end: [11, 31], angle: 'best-of posts, before and after edits' },
];

// Dated moments. date(year) returns the date for that year. approx: true means
// the real date moves year to year, so the prompt says "around" and the date
// should be checked before anything is scheduled against it.
export const DATED_MOMENTS = [
  {
    name: 'Grammys',
    approx: true,
    date: (y) => nthWeekday(y, 1, 0, 1), // usually first Sunday of February
    angle: 'music content, behind-the-scenes, award-night reactions',
  },
  {
    name: 'Super Bowl',
    date: (y) => nthWeekday(y, 1, 0, 2), // second Sunday of February
    angle: 'party content, quick fun edits',
  },
  {
    name: "Valentine's Day",
    date: (y) => utcDate(y, 1, 14),
    angle: 'love songs, warm and soft looks, gift ideas',
  },
  {
    name: 'ACM Awards',
    approx: true,
    date: (y) => nthWeekday(y, 4, 4, 2), // has moved around; roughly mid May
    angle: 'country music content, behind-the-scenes',
  },
  {
    name: 'CMA Fest',
    approx: true,
    date: (y) => nthWeekday(y, 5, 4, 1), // usually starts the first Thursday-ish of June
    angle: 'Nashville music content, live shots, local angles',
  },
  {
    name: 'Back to school',
    approx: true,
    date: (y) => utcDate(y, 7, 1),
    angle: 'desk and gear setups, study playlists',
  },
  {
    name: 'Halloween',
    date: (y) => utcDate(y, 9, 31),
    angle: 'spooky looks, costume or alter-ego content',
  },
  {
    name: 'CMA Awards',
    approx: true,
    date: (y) => nthWeekday(y, 10, 3, 3), // usually a Wednesday in mid November
    angle: 'country music content, CMA week in Nashville',
  },
  {
    name: 'Black Friday',
    date: (y) => addDays(nthWeekday(y, 10, 4, 4), 1),
    angle: 'merch and bundle drops, store sales',
  },
  {
    name: 'Cyber Monday',
    date: (y) => addDays(nthWeekday(y, 10, 4, 4), 4),
    angle: 'merch and bundle drops, store sales',
  },
  {
    name: 'Christmas',
    date: (y) => utcDate(y, 11, 25),
    angle: 'holiday lights, gift guides, cozy acoustic moments',
  },
  {
    name: "New Year's Eve",
    date: (y) => utcDate(y, 11, 31),
    angle: 'year-end recap, thank-you to fans',
  },
];

// Moments the tool can't date on its own (game and movie drops, eclipses,
// first snow). Pass them in as customMoments: [{ name, date: 'YYYY-MM-DD', angle }].

// Formats that work any time; offered as optional angles, never required.
export const EVERGREEN_TRENDS = [
  'photo dumps and carousels (month or season recaps)',
  'retro and film looks',
  'before and after edits',
  'gear and studio setup tours',
];

// ---------- lookups ----------

function seasonsOn(date) {
  const y = date.getUTCFullYear();
  return SEASONS.filter((s) => {
    const start = utcDate(y, s.start[0], s.start[1]);
    const end = utcDate(y, s.end[0], s.end[1]);
    return date >= start && date <= end;
  });
}

function datedMomentsAround(date, customMoments = []) {
  const y = date.getUTCFullYear();
  const found = [];
  for (const year of [y - 1, y, y + 1]) {
    for (const m of DATED_MOMENTS) {
      found.push({ name: m.name, date: m.date(year), approx: !!m.approx, angle: m.angle });
    }
  }
  for (const m of customMoments) {
    const d = parseDateOnly(m.date);
    if (d && m.name) found.push({ name: m.name, date: d, approx: !!m.approx, angle: m.angle || '' });
  }
  return found;
}

/**
 * Timing facts for one post date.
 * @param {Date|string} postDate
 * @param {object} [opts]
 * @param {number} [opts.windowDays]
 * @param {Array} [opts.customMoments]
 * @returns {{ date: string, seasons: Array, nearby: Array }}
 */
export function getTimingContext(postDate, opts = {}) {
  const date = parseDateOnly(postDate);
  if (!date) return null;
  const windowDays = opts.windowDays ?? TIMING_WINDOW_DAYS;

  const nearby = datedMomentsAround(date, opts.customMoments)
    .map((m) => ({ ...m, daysAway: daysBetween(date, m.date) }))
    .filter((m) => Math.abs(m.daysAway) <= windowDays)
    .sort((a, b) => Math.abs(a.daysAway) - Math.abs(b.daysAway));

  return { date: formatDate(date), seasons: seasonsOn(date), nearby };
}

/**
 * Moments 4 to 6 weeks after a given day: the ones to start building now.
 */
export function getBuildAheadMoments(fromDate, customMoments = []) {
  const date = parseDateOnly(fromDate);
  if (!date) return [];
  return datedMomentsAround(date, customMoments)
    .map((m) => ({ ...m, daysAway: daysBetween(date, m.date) }))
    .filter((m) => m.daysAway >= BUILD_AHEAD_MIN_DAYS && m.daysAway <= BUILD_AHEAD_MAX_DAYS)
    .sort((a, b) => a.daysAway - b.daysAway)
    .map((m) => ({ name: m.name, date: formatDate(m.date), approx: m.approx, daysAway: m.daysAway }));
}

/**
 * Post date for a slot: release date plus the slot's day offset.
 */
export function slotDate(releaseDate, dayOffset) {
  const d = parseDateOnly(releaseDate);
  if (!d || typeof dayOffset !== 'number') return null;
  return addDays(d, dayOffset);
}

function describeDays(n) {
  if (n === 0) return 'same day';
  const abs = Math.abs(n);
  const unit = abs === 1 ? 'day' : 'days';
  return n > 0 ? `${abs} ${unit} later` : `${abs} ${unit} earlier`;
}

/**
 * The prompt block that tells Claude how to use timing. Returns '' when there
 * is no date to work from, so prompts without a release date are unchanged.
 */
export function buildTimingBlock(postDate, opts = {}) {
  const ctx = getTimingContext(postDate, opts);
  if (!ctx) return '';

  const lines = [];
  lines.push(`Timing context (SECONDARY factor). This post goes out on ${ctx.date}.`);

  if (ctx.seasons.length) {
    lines.push('Season:');
    for (const s of ctx.seasons) lines.push(`- ${s.name}: ${s.angle}`);
  }
  if (ctx.nearby.length) {
    lines.push('Nearby moments:');
    for (const m of ctx.nearby) {
      const when = m.approx ? `around ${formatDate(m.date)}, date not confirmed` : formatDate(m.date);
      const angle = m.angle ? `: ${m.angle}` : '';
      lines.push(`- ${m.name} (${when}, ${describeDays(m.daysAway)})${angle}`);
    }
  }
  if (!ctx.seasons.length && !ctx.nearby.length) {
    lines.push('No notable season or moment falls near this date. Ignore timing for this post.');
  }
  lines.push(`Evergreen formats you may use if they fit: ${EVERGREEN_TRENDS.join('; ')}.`);

  lines.push(
    [
      'How to weigh timing:',
      "1. The artist's personality, archetype and overall content come FIRST. Build the post from who the artist is and what this release is.",
      '2. Use timing only to tune WHEN the post goes out and the ANGLE it takes, and only if it fits the artist naturally.',
      "3. If a moment doesn't fit the artist, ignore it. Never force a holiday, trend or event into the post, and never make the post off-brand to chase timing.",
      '4. Keep the slot\'s content type and campaign role. Timing adjusts the post; it does not replace it.',
      '5. If you do use a moment, add one line labelled "Timing" saying which moment and why it fits this artist. If you skip timing, leave that line out.',
    ].join('\n')
  );

  return lines.join('\n');
}
