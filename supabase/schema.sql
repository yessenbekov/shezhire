-- ============================================================
-- Шежіре: Horse Genealogy App — Supabase Schema
-- ============================================================

-- Profiles (auto-created on user signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  region text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Herds (табундар)
-- ============================================================
create table public.herds (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  location text,
  notes text,
  created_at timestamptz default now()
);

alter table public.herds enable row level security;
create policy "Users manage own herds" on public.herds for all using (auth.uid() = owner_id);

-- ============================================================
-- Horses (лошадтар)
-- ============================================================
create table public.horses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  herd_id uuid references public.herds on delete set null,

  -- Клеймо жүйесі
  brand text not null unique,        -- "26/35"
  sequence_no integer not null,      -- 35
  birth_year integer not null,       -- 2026
  sex text not null check (sex in ('м', 'ж')),

  -- Шежіре
  sire_id uuid references public.horses(id) on delete set null,  -- Әкесі
  dam_id uuid references public.horses(id) on delete set null,   -- Шешесі

  -- Қосымша
  name text,
  breed text,
  color text,
  photo_url text,
  notes text,
  is_public boolean default true,

  created_at timestamptz default now()
);

alter table public.horses enable row level security;
-- Owner can do everything
create policy "Users manage own horses" on public.horses for all using (auth.uid() = owner_id);
-- Public horses visible to all authenticated users
create policy "Authenticated can view public horses" on public.horses
  for select using (auth.role() = 'authenticated' and is_public = true);

-- Indexes
create index horses_brand_idx on public.horses(brand);
create index horses_herd_idx on public.horses(herd_id);
create index horses_owner_idx on public.horses(owner_id);
create index horses_sire_idx on public.horses(sire_id);
create index horses_dam_idx on public.horses(dam_id);

-- ============================================================
-- Recursive ancestors view (шежіре - 5 буын)
-- ============================================================
create or replace view public.horse_ancestors as
with recursive ancestors as (
  select
    id,
    brand,
    name,
    sex,
    birth_year,
    sire_id,
    dam_id,
    0 as generation
  from public.horses

  union all

  select
    h.id,
    h.brand,
    h.name,
    h.sex,
    h.birth_year,
    h.sire_id,
    h.dam_id,
    a.generation + 1
  from public.horses h
  join ancestors a on h.id = a.sire_id or h.id = a.dam_id
  where a.generation < 5
)
select * from ancestors;

-- ============================================================
-- Storage bucket for horse photos
-- ============================================================
insert into storage.buckets (id, name, public) values ('horse-photos', 'horse-photos', true);

create policy "Authenticated upload horse photos"
  on storage.objects for insert
  with check (bucket_id = 'horse-photos' and auth.role() = 'authenticated');

create policy "Public read horse photos"
  on storage.objects for select
  using (bucket_id = 'horse-photos');
