-- Recover uploads that are stuck in "processing" / "pending".
--
-- Processing is driven by the client (extract -> generate_all -> complete). When the student closes
-- the tab or app mid-way, nothing ever marks the material finished, so it spins forever and the admin
-- panel raises "Uploads are stuck in processing".
--
-- Every 10 minutes, for materials untouched for 15+ minutes (updated_at is maintained by the
-- update_study_materials_updated_at trigger, so any progress write resets the clock):
--   * study content was generated  -> mark completed (the student can open it; Rebuild fills gaps)
--   * nothing was generated         -> mark failed with a "try again" message, which the web and
--                                      mobile apps show with a Retry button
create or replace function public.recover_stuck_materials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n_completed int := 0;
  n_failed int := 0;
begin
  update public.study_materials s
     set processing_status = 'completed', processing_error = null
   where s.processing_status in ('processing', 'pending')
     and s.updated_at < now() - interval '15 minutes'
     and (exists (select 1 from public.tutor_notes t where t.material_id = s.id)
       or exists (select 1 from public.summaries x where x.material_id = s.id)
       or exists (select 1 from public.material_flashcards f where f.material_id = s.id));
  get diagnostics n_completed = row_count;

  update public.study_materials s
     set processing_status = 'failed',
         processing_error = 'Processing was interrupted before it finished. Please try again.'
   where s.processing_status in ('processing', 'pending')
     and s.updated_at < now() - interval '15 minutes';
  get diagnostics n_failed = row_count;

  return n_completed + n_failed;
end
$$;

revoke all on function public.recover_stuck_materials() from public, anon, authenticated;

-- Re-runnable: drop the old schedule if it exists, then (re)create it.
select cron.unschedule(jobid) from cron.job where jobname = 'recover-stuck-materials';
select cron.schedule('recover-stuck-materials', '*/10 * * * *', $cron$select public.recover_stuck_materials()$cron$);

-- Run once now for the uploads already stuck.
select public.recover_stuck_materials();
