import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ActivityType =
  | 'flashcard_review'
  | 'quiz'
  | 'notes_read'
  | 'summary_read'
  | 'concept_map'
  | 'tutor_chat';

const ALLOWED: ActivityType[] = [
  'flashcard_review', 'quiz', 'notes_read', 'summary_read', 'concept_map', 'tutor_chat',
];

const PASSIVE_CAP = new Set<ActivityType>(['notes_read', 'summary_read', 'concept_map', 'tutor_chat']);

function bad(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Mirror of web's level formula (useAwardXP): level = floor(xp / 1000) + 1
function levelFromXp(xp: number) {
  return Math.floor(xp / 1000) + 1;
}

function todayBoundsIso(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad(405, 'Method not allowed');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return bad(401, 'Unauthorized');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsErr } = await authed.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return bad(401, 'Unauthorized');
  const userId = claimsData.claims.sub as string;

  let body: any;
  try { body = await req.json(); } catch { return bad(400, 'Invalid JSON'); }

  const activity_type = body?.activity_type as ActivityType;
  if (!ALLOWED.includes(activity_type)) return bad(400, 'Invalid activity_type');

  const material_id = body?.material_id ?? null;
  const deck_id = body?.deck_id ?? null;
  const duration_seconds = Math.max(0, Math.floor(Number(body?.duration_seconds ?? 0)));
  const items_count = Math.max(0, Math.floor(Number(body?.items_count ?? 0)));
  const correct_count = Math.max(0, Math.min(items_count, Math.floor(Number(body?.correct_count ?? 0))));
  const event_id: string | null = typeof body?.event_id === 'string' ? body.event_id : null;

  // Service-role client for inserts/updates that bypass RLS where needed.
  const svc = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Idempotency: if event_id supplied and already recorded, return existing.
  if (event_id) {
    const { data: existing } = await svc
      .from('study_activity')
      .select('id, xp_awarded')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ xp_awarded: existing.xp_awarded, already_recorded: true, newly_earned: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  }

  // XP calculation (server is the only authority).
  const { start: dayStart, end: dayEnd } = todayBoundsIso();
  let xp = 0;

  if (activity_type === 'flashcard_review') {
    xp = 15 * correct_count + 5 * Math.max(0, items_count - correct_count);
  } else if (activity_type === 'quiz') {
    // Per-material-per-day cap: full XP first attempt, 0 thereafter (streak still rolls).
    let priorToday = 0;
    if (material_id) {
      const { count } = await svc
        .from('study_activity')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'quiz')
        .eq('material_id', material_id)
        .gte('created_at', dayStart)
        .lt('created_at', dayEnd);
      priorToday = count ?? 0;
    }
    xp = priorToday === 0 ? (10 * correct_count + 20) : 0;
  } else if (PASSIVE_CAP.has(activity_type)) {
    const base = activity_type === 'notes_read' || activity_type === 'summary_read' ? 10 : 5;
    let priorToday = 0;
    if (material_id) {
      const { count } = await svc
        .from('study_activity')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', activity_type)
        .eq('material_id', material_id)
        .gte('created_at', dayStart)
        .lt('created_at', dayEnd);
      priorToday = count ?? 0;
    }
    xp = priorToday === 0 ? base : 0;
  }

  // Insert the activity row.
  const { error: insertErr } = await svc
    .from('study_activity')
    .insert({
      user_id: userId,
      material_id,
      deck_id,
      activity_type,
      duration_seconds,
      items_count,
      correct_count,
      xp_awarded: xp,
      event_id,
    });

  if (insertErr) {
    // Unique-violation on (user_id, event_id) → treat as idempotent replay.
    if ((insertErr as any).code === '23505' && event_id) {
      const { data: existing } = await svc
        .from('study_activity')
        .select('xp_awarded')
        .eq('user_id', userId)
        .eq('event_id', event_id)
        .maybeSingle();
      return new Response(
        JSON.stringify({ xp_awarded: existing?.xp_awarded ?? 0, already_recorded: true, newly_earned: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    console.error('insert study_activity failed', insertErr);
    return bad(500, 'Failed to record activity');
  }

  // Streak roll-forward + XP/level update on profiles.
  const { data: profile } = await svc
    .from('profiles')
    .select('xp, level, current_streak, longest_streak, last_study_date')
    .eq('user_id', userId)
    .maybeSingle();

  const today = new Date();
  const todayDateStr = today.toISOString().slice(0, 10);
  let nextStreak = 1;
  let longestStreak = profile?.longest_streak ?? 0;

  if (profile?.last_study_date) {
    const last = new Date(profile.last_study_date as string);
    const lastDateStr = last.toISOString().slice(0, 10);
    if (lastDateStr === todayDateStr) {
      nextStreak = profile.current_streak ?? 1;
    } else {
      const diffDays = Math.round((Date.parse(todayDateStr) - Date.parse(lastDateStr)) / 86400000);
      nextStreak = diffDays === 1 ? (profile.current_streak ?? 0) + 1 : 1;
    }
  }
  if (nextStreak > longestStreak) longestStreak = nextStreak;

  const newXp = (profile?.xp ?? 0) + xp;
  const newLevel = levelFromXp(newXp);

  await svc
    .from('profiles')
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: nextStreak,
      longest_streak: longestStreak,
      last_study_date: todayDateStr,
    })
    .eq('user_id', userId);

  // Achievement re-check (inline).
  const newly_earned: { id: string; name: string; xp_reward: number }[] = [];
  try {
    const [{ data: catalog }, { data: earnedRows }] = await Promise.all([
      svc.from('achievements').select('id, name, category, requirement_value, xp_reward'),
      svc.from('user_achievements').select('achievement_id').eq('user_id', userId),
    ]);

    const earnedSet = new Set((earnedRows ?? []).map((r: any) => r.achievement_id));

    // Aggregates needed: streak (already updated), cards (count of flashcard_review items),
    // study_time minutes (sum duration), mastery (count flashcards with interval_days >= 21).
    const [cardsAgg, timeAgg, masteryAgg] = await Promise.all([
      svc.from('study_activity_v')
        .select('cards_or_items')
        .eq('user_id', userId)
        .eq('activity_type', 'flashcard_review'),
      svc.from('study_activity_v')
        .select('duration_seconds')
        .eq('user_id', userId),
      svc.from('flashcards')
        .select('id, deck_id, interval_days, flashcard_decks!inner(user_id)')
        .eq('flashcard_decks.user_id', userId)
        .gte('interval_days', 21),
    ]);

    const totalCards = (cardsAgg.data ?? []).reduce((s: number, r: any) => s + (r.cards_or_items ?? 0), 0);
    const totalMinutes = Math.floor(
      (timeAgg.data ?? []).reduce((s: number, r: any) => s + (r.duration_seconds ?? 0), 0) / 60,
    );
    const masteredCount = (masteryAgg.data ?? []).length;

    for (const a of catalog ?? []) {
      if (earnedSet.has(a.id)) continue;
      let value = 0;
      switch (a.category) {
        case 'streaks': value = nextStreak; break;
        case 'cards': value = totalCards; break;
        case 'study_time': value = totalMinutes; break;
        case 'mastery': value = masteredCount; break;
        default: continue;
      }
      if (value >= a.requirement_value) {
        const { error: achErr } = await svc.from('user_achievements').insert({
          user_id: userId, achievement_id: a.id,
        });
        if (!achErr) {
          newly_earned.push({ id: a.id, name: a.name, xp_reward: a.xp_reward });
          await svc.from('profiles')
            .update({ xp: (await svc.from('profiles').select('xp').eq('user_id', userId).maybeSingle()).data?.xp + a.xp_reward })
            .eq('user_id', userId);
          await svc.from('notifications').insert({
            user_id: userId,
            type: 'achievement',
            title: 'Achievement unlocked',
            message: a.name,
            data: { achievement_id: a.id },
          });
        }
      }
    }
  } catch (e) {
    console.error('Achievement re-check failed (non-fatal):', e);
  }

  const finalXpRow = await svc.from('profiles').select('xp, level').eq('user_id', userId).maybeSingle();

  return new Response(
    JSON.stringify({
      xp_awarded: xp,
      new_level: finalXpRow.data?.level ?? newLevel,
      total_xp: finalXpRow.data?.xp ?? newXp,
      current_streak: nextStreak,
      newly_earned,
      already_recorded: false,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
