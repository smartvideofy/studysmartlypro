-- Create a private bucket for note attachments (PDF/images/etc)
insert into storage.buckets (id, name, public)
values ('note-attachments', 'note-attachments', false)
on conflict (id) do nothing;

-- Table to store attachment metadata (NO file blobs)
create table if not exists public.note_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  note_id uuid not null references public.notes(id) on delete cascade,
  bucket_id text not null default 'note-attachments',
  object_path text not null,
  file_name text not null,
  mime_type text null,
  size_bytes bigint null,
  created_at timestamptz not null default now()
);

create index if not exists idx_note_attachments_note_id on public.note_attachments(note_id);
create index if not exists idx_note_attachments_user_id on public.note_attachments(user_id);

alter table public.note_attachments enable row level security;

-- RLS: users can only manage their own attachments
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='note_attachments'
      and policyname='Users can view their own note attachments'
  ) then
    create policy "Users can view their own note attachments"
    on public.note_attachments
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='note_attachments'
      and policyname='Users can add attachments to their own notes'
  ) then
    create policy "Users can add attachments to their own notes"
    on public.note_attachments
    for insert
    with check (
      auth.uid() = user_id
      and exists (
        select 1 from public.notes n
        where n.id = note_id and n.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='note_attachments'
      and policyname='Users can delete their own note attachments'
  ) then
    create policy "Users can delete their own note attachments"
    on public.note_attachments
    for delete
    using (auth.uid() = user_id);
  end if;
end $$;

-- Storage policies for the note-attachments bucket.
-- Path convention: {userId}/{noteId}/{filename}
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Users can view their own note attachment objects'
  ) then
    create policy "Users can view their own note attachment objects"
    on storage.objects
    for select
    using (
      bucket_id = 'note-attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Users can upload their own note attachment objects'
  ) then
    create policy "Users can upload their own note attachment objects"
    on storage.objects
    for insert
    with check (
      bucket_id = 'note-attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Users can update their own note attachment objects'
  ) then
    create policy "Users can update their own note attachment objects"
    on storage.objects
    for update
    using (
      bucket_id = 'note-attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'note-attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Users can delete their own note attachment objects'
  ) then
    create policy "Users can delete their own note attachment objects"
    on storage.objects
    for delete
    using (
      bucket_id = 'note-attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;
