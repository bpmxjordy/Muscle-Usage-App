-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MuscleMap – Full Database Schema                              ║
-- ║  Run this in the Supabase SQL Editor                           ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Profiles ────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  height_cm numeric,
  weight_kg numeric,
  age integer,
  gender text check (gender in ('male', 'female', 'other')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Workouts ────────────────────────────────────────────────────────
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Workout',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_minutes integer,
  notes text,
  mood integer check (mood between 1 and 5),
  created_at timestamptz default now()
);

create index idx_workouts_user on public.workouts(user_id);

-- ─── Workout Exercises ───────────────────────────────────────────────
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  "order" integer not null default 0,
  notes text
);

create index idx_we_workout on public.workout_exercises(workout_id);

-- ─── Workout Sets ────────────────────────────────────────────────────
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number integer not null,
  reps integer not null default 0,
  weight_kg numeric not null default 0,
  rpe integer check (rpe between 1 and 10),
  is_warmup boolean default false,
  is_pr boolean default false
);

create index idx_ws_exercise on public.workout_sets(workout_exercise_id);

-- ─── Routines ────────────────────────────────────────────────────────
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  day_of_week text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_routines_user on public.routines(user_id);

-- ─── Routine Exercises ───────────────────────────────────────────────
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  target_sets integer default 3,
  target_reps_min integer default 8,
  target_reps_max integer default 12,
  rest_seconds integer default 90,
  "order" integer not null default 0
);

create index idx_re_routine on public.routine_exercises(routine_id);

-- ─── Personal Records ───────────────────────────────────────────────
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  weight_kg numeric not null,
  reps integer not null,
  estimated_1rm numeric not null,
  achieved_at timestamptz default now(),
  workout_id uuid references public.workouts(id) on delete set null
);

create index idx_pr_user on public.personal_records(user_id);

-- ─── Follows ─────────────────────────────────────────────────────────
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

-- ─── Feed Items ──────────────────────────────────────────────────────
create table if not exists public.feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('workout', 'pr', 'routine')),
  title text not null,
  description text,
  workout_id uuid references public.workouts(id) on delete cascade,
  pr_id uuid references public.personal_records(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete cascade,
  created_at timestamptz default now()
);

create index idx_feed_user on public.feed_items(user_id);
create index idx_feed_created on public.feed_items(created_at desc);

-- ─── Feed Likes ──────────────────────────────────────────────────────
create table if not exists public.feed_likes (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(feed_item_id, user_id)
);

-- ─── Feed Comments ───────────────────────────────────────────────────
create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- ─── Daily Nutrition ─────────────────────────────────────────────────
create table if not exists public.daily_nutrition (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  calories numeric default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  water_ml numeric default 0,
  unique(user_id, date)
);

create index idx_nutrition_user_date on public.daily_nutrition(user_id, date);


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Row Level Security Policies                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.personal_records enable row level security;
alter table public.follows enable row level security;
alter table public.feed_items enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
alter table public.daily_nutrition enable row level security;

-- ─── Profiles Policies ──────────────────────────────────────────────
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── Workouts Policies ──────────────────────────────────────────────
create policy "Users can view own workouts"
  on public.workouts for select using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on public.workouts for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on public.workouts for update using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on public.workouts for delete using (auth.uid() = user_id);

-- ─── Workout Exercises Policies ─────────────────────────────────────
create policy "Users can view own workout exercises"
  on public.workout_exercises for select
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "Users can insert own workout exercises"
  on public.workout_exercises for insert
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "Users can update own workout exercises"
  on public.workout_exercises for update
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "Users can delete own workout exercises"
  on public.workout_exercises for delete
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- ─── Workout Sets Policies ──────────────────────────────────────────
create policy "Users can view own workout sets"
  on public.workout_sets for select
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

create policy "Users can insert own workout sets"
  on public.workout_sets for insert
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

create policy "Users can update own workout sets"
  on public.workout_sets for update
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

create policy "Users can delete own workout sets"
  on public.workout_sets for delete
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

-- ─── Routines Policies ──────────────────────────────────────────────
create policy "Users can view own or public routines"
  on public.routines for select using (auth.uid() = user_id or is_public = true);

create policy "Users can insert own routines"
  on public.routines for insert with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on public.routines for update using (auth.uid() = user_id);

create policy "Users can delete own routines"
  on public.routines for delete using (auth.uid() = user_id);

-- ─── Routine Exercises Policies ─────────────────────────────────────
create policy "Users can view routine exercises"
  on public.routine_exercises for select
  using (exists (select 1 from public.routines r where r.id = routine_id and (r.user_id = auth.uid() or r.is_public = true)));

create policy "Users can insert own routine exercises"
  on public.routine_exercises for insert
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

create policy "Users can update own routine exercises"
  on public.routine_exercises for update
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

create policy "Users can delete own routine exercises"
  on public.routine_exercises for delete
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

-- ─── Personal Records Policies ──────────────────────────────────────
create policy "Users can view own PRs"
  on public.personal_records for select using (auth.uid() = user_id);

create policy "Users can insert own PRs"
  on public.personal_records for insert with check (auth.uid() = user_id);

create policy "Users can delete own PRs"
  on public.personal_records for delete using (auth.uid() = user_id);

-- ─── Follows Policies ───────────────────────────────────────────────
create policy "Anyone can view follows"
  on public.follows for select using (true);

create policy "Users can follow others"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- ─── Feed Items Policies ────────────────────────────────────────────
create policy "Users can view feed from followed users"
  on public.feed_items for select using (
    user_id = auth.uid() or
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = feed_items.user_id)
  );

create policy "Users can insert own feed items"
  on public.feed_items for insert with check (auth.uid() = user_id);

create policy "Users can delete own feed items"
  on public.feed_items for delete using (auth.uid() = user_id);

-- ─── Feed Likes Policies ────────────────────────────────────────────
create policy "Anyone can view likes"
  on public.feed_likes for select using (true);

create policy "Users can like"
  on public.feed_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.feed_likes for delete using (auth.uid() = user_id);

-- ─── Feed Comments Policies ─────────────────────────────────────────
create policy "Anyone can view comments"
  on public.feed_comments for select using (true);

create policy "Users can comment"
  on public.feed_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.feed_comments for delete using (auth.uid() = user_id);

-- ─── Daily Nutrition Policies ────────────────────────────────────────
create policy "Users can view own nutrition"
  on public.daily_nutrition for select using (auth.uid() = user_id);

create policy "Users can insert own nutrition"
  on public.daily_nutrition for insert with check (auth.uid() = user_id);

create policy "Users can update own nutrition"
  on public.daily_nutrition for update using (auth.uid() = user_id);

create policy "Users can delete own nutrition"
  on public.daily_nutrition for delete using (auth.uid() = user_id);
