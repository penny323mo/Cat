-- Photo albums
create table photo_album (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  name text not null,
  cover_url text,
  created_at timestamptz default now()
);

alter table photo_album enable row level security;
create policy "Own albums" on photo_album for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

-- Add album_id to photo
alter table photo add column if not exists album_id uuid references photo_album(id) on delete set null;
