-- Add policy to allow group members to view each other's basic profile info
-- This enables proper display of names and avatars in group chats and member lists
CREATE POLICY "Group members can view each other's profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = profiles.user_id
    )
  );