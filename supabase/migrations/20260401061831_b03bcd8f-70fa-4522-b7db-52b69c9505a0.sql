
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read invites by code" ON public.group_invites;

-- Create a secure RPC for validating and joining via invite code
CREATE OR REPLACE FUNCTION public.validate_and_join_invite(p_invite_code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id uuid;
  v_existing RECORD;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Find the invite
  SELECT * INTO v_invite
  FROM group_invites
  WHERE invite_code = p_invite_code
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invite code');
  END IF;

  -- Check max uses
  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('error', 'This invite has reached its maximum uses');
  END IF;

  -- Check if already a member
  SELECT id INTO v_existing
  FROM group_members
  WHERE group_id = v_invite.group_id AND user_id = v_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'You are already a member of this group');
  END IF;

  -- Join the group
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_invite.group_id, v_user_id, 'member');

  -- Increment use count
  UPDATE group_invites SET use_count = use_count + 1 WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'group_id', v_invite.group_id);
END;
$$;
