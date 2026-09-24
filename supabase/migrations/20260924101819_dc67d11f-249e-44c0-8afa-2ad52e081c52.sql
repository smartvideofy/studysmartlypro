
CREATE POLICY "Group members can view group media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'group-media'
  AND public.is_group_member(NULLIF((storage.foldername(name))[1], '')::uuid, auth.uid())
);

CREATE POLICY "Group members can upload group media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'group-media'
  AND public.is_group_member(NULLIF((storage.foldername(name))[1], '')::uuid, auth.uid())
);

CREATE POLICY "Uploaders can delete their group media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'group-media' AND owner = auth.uid());
