-- Create group_members table first (referenced by study_groups RLS)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create study_groups table
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

-- Add FK constraint after both tables exist
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_group_id_fkey
FOREIGN KEY (group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE;

ALTER TABLE public.group_members ADD CONSTRAINT group_members_unique UNIQUE(group_id, user_id);

-- RLS for study_groups
CREATE POLICY "Users can view public groups or their groups"
ON public.study_groups FOR SELECT
USING (is_private = false OR owner_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()
));

CREATE POLICY "Users can create groups"
ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their groups"
ON public.study_groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their groups"
ON public.study_groups FOR DELETE USING (auth.uid() = owner_id);

-- RLS for group_members - using security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Users can view members of their groups"
ON public.group_members FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Owners can add members"
ON public.group_members FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.study_groups WHERE id = group_id AND owner_id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (user_id = auth.uid());

CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON public.study_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add owner as member
CREATE OR REPLACE FUNCTION public.add_owner_as_group_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER add_owner_as_member_trigger
AFTER INSERT ON public.study_groups
FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_group_member();

-- Update member count trigger
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.study_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.study_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_group_member_count_trigger
AFTER INSERT OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE USING (auth.uid() = user_id);