

# Fix Notification Gaps and Improve NotificationBell

## Overview
Add in-app notifications for all major events that currently only trigger toasts/emails, and upgrade NotificationBell with smart routing using the `data` field and complete icon coverage.

## Changes

### 1. Add in-app notifications to gamification hooks (`src/hooks/useGamification.tsx`)

Insert `supabase.from("notifications").insert(...)` calls at three points:

- **Achievement unlocked** (in `useCheckAchievements`, after successful insert into `user_achievements`):
  - type: `"achievement"`, title: "Achievement Unlocked: {name}", data: `{ achievement_id }`

- **Level up** (in `useAwardXP`, when `leveledUp` is true):
  - type: `"level_up"`, title: "Level Up! You're now level {N}!", data: `{}`

- **Streak lost** (in `useAwardXP`, when `streakLost && previousStreak > 1`):
  - type: `"streak_lost"`, title: "Your {N}-day streak was lost", data: `{}`

- **Daily challenge completed** (in `useUpdateDailyChallenge`, when `completed` is true):
  - type: `"daily_challenge"`, title: "Daily Challenge Complete!", data: `{ xp_reward }`

### 2. Add notification for group member joins (`src/hooks/useGroupInvites.tsx`)

In `useJoinByInvite`, after successful group join, notify all existing group members:
- Fetch group name and joiner's profile name
- Insert a notification for each existing member (excluding the joiner):
  - type: `"group_member_joined"`, title: "{name} joined {group}", data: `{ group_id }`

### 3. Add notification for shared notes (`src/hooks/useSharedNotes.tsx`)

In `useShareNote`, after successful share, notify group members:
- Fetch group name, note title, and sharer's profile name
- Insert a notification for each group member (excluding the sharer):
  - type: `"shared_note"`, title: "{name} shared a note in {group}", data: `{ group_id, note_id }`

### 4. Upgrade NotificationBell (`src/components/notifications/NotificationBell.tsx`)

**Add missing icons** to `typeIcons` map:
| Type | Icon |
|---|---|
| `mention` | "💬" |
| `session_reminder` | "📅" |
| `level_up` | "⬆️" |
| `streak_lost` | "💔" |
| `daily_challenge` | "🎯" |
| `group_member_joined` | "👋" |
| `shared_note` | "📝" |
| `trial_expired` | "⏰" |
| `subscription` | "💳" |

**Smart routing using `data` field:**
Replace `handleNotificationClick` to read `notification.data` and route to specific resources:
- `group_invite`, `group_member_joined`, `shared_note`, `mention`, `session_reminder` with `data.group_id` -> `/groups/{group_id}`
- `achievement` -> `/achievements`
- `level_up`, `streak_lost`, `daily_challenge` -> `/progress`
- `study_reminder` -> `/flashcards`
- `trial_expired`, `subscription` -> `/pricing`
- Fallback: `/dashboard`

Also stop event propagation on the Mark-as-read and Delete buttons so clicking them doesn't trigger navigation.

## Technical details

### RLS consideration
The notifications table INSERT policy requires `auth.uid() = user_id`. For group-wide notifications (member joins, shared notes), each notification is inserted individually with the recipient's `user_id`. Since the inserting user's auth.uid() won't match the recipient's user_id, we need to add a **service-level INSERT policy** or use a **database trigger/function**.

**Chosen approach:** Create a Postgres function `notify_group_members(p_group_id, p_sender_id, p_type, p_title, p_message, p_data)` with `SECURITY DEFINER` that inserts notifications for all group members except the sender. This avoids RLS issues.

### Database migration
Create a `SECURITY DEFINER` function:
```sql
CREATE OR REPLACE FUNCTION public.notify_group_members(
  p_group_id uuid, p_sender_id uuid, p_type text, 
  p_title text, p_message text, p_data jsonb DEFAULT '{}'
) RETURNS void AS $$
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT gm.user_id, p_type, p_title, p_message, p_data
  FROM public.group_members gm
  WHERE gm.group_id = p_group_id AND gm.user_id != p_sender_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = 'public';
```

Then call it from the client via `supabase.rpc("notify_group_members", {...})`.

For self-notifications (achievements, level-up, etc.), the existing INSERT policy works fine since the user is inserting their own notification.

### Files to modify
| File | Change |
|---|---|
| `src/hooks/useGamification.tsx` | Add notification inserts for achievement, level-up, streak-loss, daily challenge |
| `src/hooks/useGroupInvites.tsx` | Add `rpc("notify_group_members")` call on join |
| `src/hooks/useSharedNotes.tsx` | Add `rpc("notify_group_members")` call on share |
| `src/components/notifications/NotificationBell.tsx` | Add all icons, smart routing with `data` field, fix event propagation |
| New migration | Create `notify_group_members` function |

