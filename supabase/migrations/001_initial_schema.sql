-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Cat profiles
create table cat_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  breed text,
  gender text check (gender in ('male', 'female', 'unknown')),
  birthday date,
  adopted_date date,
  avatar_url text,
  color text,
  microchip_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feeding logs
create table feeding_log (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  fed_at timestamptz not null default now(),
  food_type text check (food_type in ('dry', 'wet', 'treat', 'other')) not null,
  food_brand text,
  amount_g numeric,
  notes text,
  created_at timestamptz default now()
);

-- Weight logs
create table weight_log (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  measured_at date not null default current_date,
  weight_kg numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- Vet records
create table vet_record (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  visit_date date not null,
  vet_name text,
  reason text,
  diagnosis text,
  treatment text,
  cost numeric,
  next_visit_date date,
  notes text,
  created_at timestamptz default now()
);

-- Reminders
create table reminder (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  type text check (type in ('vaccine', 'deworming', 'vet_visit', 'custom')) not null,
  title text not null,
  due_date date not null,
  is_done boolean default false,
  recurrence_days integer,
  notes text,
  created_at timestamptz default now()
);

-- Mood logs
create table mood_log (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  mood text check (mood in ('happy', 'playful', 'sleepy', 'anxious', 'sick', 'angry')) not null,
  energy_level integer check (energy_level between 1 and 5) not null,
  note text,
  created_at timestamptz default now()
);

-- Milestones
create table milestone (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  date date not null,
  title text not null,
  description text,
  photo_url text,
  created_at timestamptz default now()
);

-- Photos
create table photo (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  url text not null,
  caption text,
  taken_at timestamptz not null default now(),
  tags text[],
  created_at timestamptz default now()
);

-- Expenses
create table expense (
  id uuid primary key default uuid_generate_v4(),
  cat_id uuid references cat_profile(id) on delete cascade not null,
  date date not null default current_date,
  category text check (category in ('food', 'medical', 'toy', 'grooming', 'other')) not null,
  amount numeric not null,
  description text,
  created_at timestamptz default now()
);

-- RLS
alter table cat_profile enable row level security;
alter table feeding_log enable row level security;
alter table weight_log enable row level security;
alter table vet_record enable row level security;
alter table reminder enable row level security;
alter table mood_log enable row level security;
alter table milestone enable row level security;
alter table photo enable row level security;
alter table expense enable row level security;

-- Policies: users can only access their own cats and related records
create policy "Own cats" on cat_profile for all using (auth.uid() = user_id);

create policy "Own feeding logs" on feeding_log for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own weight logs" on weight_log for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own vet records" on vet_record for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own reminders" on reminder for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own mood logs" on mood_log for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own milestones" on milestone for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own photos" on photo for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

create policy "Own expenses" on expense for all
  using (cat_id in (select id from cat_profile where user_id = auth.uid()));

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cat_profile_updated_at
  before update on cat_profile
  for each row execute function update_updated_at();

-- Storage bucket for cat media
insert into storage.buckets (id, name, public) values ('cat-media', 'cat-media', true);

create policy "Anyone can read cat media" on storage.objects for select
  using (bucket_id = 'cat-media');

create policy "Authenticated users can upload" on storage.objects for insert
  with check (bucket_id = 'cat-media' and auth.role() = 'authenticated');

create policy "Users can delete own uploads" on storage.objects for delete
  using (bucket_id = 'cat-media' and auth.uid() = owner);
