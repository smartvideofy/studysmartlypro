-- Add missing RLS policies for production security

-- 1. user_roles table - Prevent unauthorized role modifications
-- Block all client-side INSERT (only trigger should insert)
CREATE POLICY "Block client role inserts" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (false);

-- Prevent all updates to roles from client
CREATE POLICY "Block client role updates" ON public.user_roles
FOR UPDATE TO authenticated
USING (false);

-- Prevent all deletes from client
CREATE POLICY "Block client role deletes" ON public.user_roles
FOR DELETE TO authenticated
USING (false);

-- Allow users to read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2. group_members table - Only owners can update member roles
CREATE POLICY "Owners can update member roles" ON public.group_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.study_groups 
    WHERE study_groups.id = group_members.group_id 
    AND study_groups.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.study_groups 
    WHERE study_groups.id = group_members.group_id 
    AND study_groups.owner_id = auth.uid()
  )
);

-- 3. profiles table - Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4. group_messages table - Users can update their own messages
CREATE POLICY "Users can update own messages" ON public.group_messages
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 5. shared_notes table - Sharers can update their shared notes
CREATE POLICY "Sharers can update shared notes" ON public.shared_notes
FOR UPDATE TO authenticated
USING (auth.uid() = shared_by);

-- 6. note_attachments table - Users can update their own attachments
CREATE POLICY "Users can update own attachments" ON public.note_attachments
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);