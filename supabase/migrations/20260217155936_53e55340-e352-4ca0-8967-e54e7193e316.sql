CREATE OR REPLACE FUNCTION public.notify_group_members(
  p_group_id uuid,
  p_sender_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT gm.user_id, p_type, p_title, p_message, p_data
  FROM public.group_members gm
  WHERE gm.group_id = p_group_id AND gm.user_id != p_sender_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = 'public';