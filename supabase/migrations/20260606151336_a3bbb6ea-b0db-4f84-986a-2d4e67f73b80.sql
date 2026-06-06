CREATE TABLE public.study_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  material_id uuid references public.study_materials(id) on delete set null,
  deck_id uuid references public.flashcard_decks(id) on delete set null,
  activity_type text not null check (activity_type in
    ('flashcard_review','quiz','notes_read','summary_read','concept_map','tutor_chat')),
  duration_seconds integer not null default 0,
  items_count integer not null default 0,
  correct_count integer not null default 0,
  xp_awarded integer not null default 0,
  event_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

GRANT SELECT, INSERT ON public.study_activity TO authenticated;
GRANT ALL ON public.study_activity TO service_role;

ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activity"
  ON public.study_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own activity"
  ON public.study_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_study_activity_user_created
  ON public.study_activity (user_id, created_at desc);
CREATE INDEX idx_study_activity_user_type_created
  ON public.study_activity (user_id, activity_type, created_at desc);
CREATE INDEX idx_study_activity_user_material_type
  ON public.study_activity (user_id, material_id, activity_type, created_at);

CREATE VIEW public.study_activity_v
WITH (security_invoker = true) AS
SELECT
  user_id,
  created_at AS occurred_at,
  duration_seconds,
  items_count AS cards_or_items,
  correct_count,
  activity_type,
  material_id
FROM public.study_activity
UNION ALL
SELECT
  user_id,
  started_at AS occurred_at,
  COALESCE(total_time_seconds, 0) AS duration_seconds,
  COALESCE(cards_studied, 0) AS cards_or_items,
  COALESCE(correct_count, 0) AS correct_count,
  'flashcard_review'::text AS activity_type,
  NULL::uuid AS material_id
FROM public.study_sessions
WHERE ended_at IS NOT NULL;

GRANT SELECT ON public.study_activity_v TO authenticated;