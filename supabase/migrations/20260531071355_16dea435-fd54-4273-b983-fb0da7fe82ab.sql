CREATE OR REPLACE FUNCTION public.get_group_unread_counts(p_group_ids uuid[])
RETURNS TABLE(group_id uuid, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT g.id AS group_id,
         COUNT(gm.id) FILTER (
           WHERE gm.user_id <> v_user
             AND (r.last_read_at IS NULL OR gm.created_at > r.last_read_at)
         ) AS count
  FROM unnest(p_group_ids) AS g(id)
  LEFT JOIN public.group_message_reads r
    ON r.group_id = g.id AND r.user_id = v_user
  LEFT JOIN public.group_messages gm
    ON gm.group_id = g.id
  GROUP BY g.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_unread_counts(uuid[]) TO authenticated;