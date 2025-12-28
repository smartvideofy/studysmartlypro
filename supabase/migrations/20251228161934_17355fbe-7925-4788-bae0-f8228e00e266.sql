-- Fix the broken RLS SELECT policy for study_groups
-- The current policy has a bug: group_members.group_id = group_members.id (should be study_groups.id)

DROP POLICY IF EXISTS "Users can view public groups or their groups" ON public.study_groups;

CREATE POLICY "Users can view public groups or their groups" 
ON public.study_groups 
FOR SELECT 
USING (
  (is_private = false) 
  OR (owner_id = auth.uid()) 
  OR (EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = study_groups.id 
    AND group_members.user_id = auth.uid()
  ))
);