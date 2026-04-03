
-- Check if user_achievements table exists and has permissive INSERT policy
DO $$
BEGIN
  -- Drop overly permissive INSERT policy on user_achievements if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_achievements' 
    AND cmd = 'INSERT'
    AND qual IS NULL
    AND with_check::text LIKE '%auth.uid()%'
  ) THEN
    DROP POLICY IF EXISTS "Users can earn achievements" ON public.user_achievements;
  END IF;
END $$;

-- Ensure email_logs has no INSERT policy for authenticated users (writes are service-role only)
-- The table already blocks INSERT per the schema review, so this is a safety net
DO $$
BEGIN
  -- Drop any INSERT policies that might exist
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND cmd = 'INSERT'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.email_logs;', ' ')
      FROM pg_policies WHERE tablename = 'email_logs' AND cmd = 'INSERT'
    );
  END IF;
END $$;

-- Ensure email_logs has no DELETE policy for authenticated users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND cmd = 'DELETE'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.email_logs;', ' ')
      FROM pg_policies WHERE tablename = 'email_logs' AND cmd = 'DELETE'
    );
  END IF;
END $$;

-- Ensure email_logs has no UPDATE policy for authenticated users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND cmd = 'UPDATE'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.email_logs;', ' ')
      FROM pg_policies WHERE tablename = 'email_logs' AND cmd = 'UPDATE'
    );
  END IF;
END $$;
