-- Odyssey — initial schema (ODYSSEY_MASTER_PROMPT_CODEX.md §9).
-- Not yet wired to the application (Phase 1 runs entirely on localStorage —
-- see src/lib/local-storage-repository.ts). Written now so Phase 2
-- (Supabase Auth + Postgres) can migrate existing guest state instead of
-- designing the schema from scratch.
--
-- Bilingual/script content (French title, scripted fallback turns, example
-- debrief) is not itemized as separate columns in the master brief's
-- §9 table list, so it is kept in a single `content` jsonb column per
-- mission, mirroring apps/web/src/domain/types.ts::Mission exactly. Every
-- other column matches the brief's table definitions directly.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Public catalogue (readable without authentication)
-- ---------------------------------------------------------------------------

create table capabilities (
  id text primary key,
  slug text not null unique,
  label_fr text not null,
  description_fr text not null
);

create table missions (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  target_capability_id text not null references capabilities (id),
  context_type text not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  estimated_minutes integer not null check (estimated_minutes > 0),
  opening_prompt jsonb not null,
  success_criteria jsonb not null,
  content jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

alter table capabilities enable row level security;
alter table missions enable row level security;

create policy "capabilities are publicly readable"
  on capabilities for select
  using (true);

create policy "active missions are publicly readable"
  on missions for select
  using (active);

-- ---------------------------------------------------------------------------
-- Per-user data (owner-only access)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  native_language text not null default 'fr',
  target_language text not null default 'en',
  profession text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  translation_mode text not null default 'adaptive'
    check (translation_mode in ('always', 'adaptive', 'on_demand')),
  auto_speak boolean not null default true,
  slow_speech boolean not null default false,
  preferred_session_minutes integer not null default 8,
  notification_settings jsonb not null default '{}'::jsonb,
  -- Current consent snapshot (ConsentState in src/domain/types.ts). The
  -- append-only history a real audit trail would want lives in
  -- consent_records below; this column is the fast-read "current state".
  consent jsonb not null default '{}'::jsonb
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  category text not null check (category in ('work', 'travel', 'studies', 'personal')),
  label text not null,
  priority smallint not null default 1,
  active boolean not null default true
);

create table user_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  label text not null,
  metadata jsonb not null default '{}'::jsonb
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  mission_id text not null references missions (id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  learner_word_count integer not null default 0,
  coach_word_count integer not null default 0,
  translation_usage_count integer not null default 0,
  aggregate_scores jsonb not null default '{}'::jsonb,
  debrief jsonb
);

create table conversation_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  turn_index integer not null,
  role text not null check (role in ('coach', 'user')),
  english_text text not null,
  french_text text,
  transcription_confidence real,
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create table user_capabilities (
  user_id uuid not null references profiles (id) on delete cascade,
  capability_id text not null references capabilities (id),
  status text not null default 'not_explored',
  confidence_score real not null default 0,
  demonstrated_score real not null default 0,
  attempt_count integer not null default 0,
  trend text not null default 'flat',
  evidence jsonb not null default '[]'::jsonb,
  last_practiced_at timestamptz,
  primary key (user_id, capability_id)
);

create table recurring_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  category text not null,
  pattern text not null,
  example text not null,
  count integer not null default 1,
  status text not null default 'active' check (status in ('active', 'resolved')),
  last_seen_at timestamptz not null default now()
);

create table user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  category text not null,
  content text not null,
  source text not null check (source in ('declared', 'observed', 'inferred')),
  confidence real not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  consent_type text not null,
  granted boolean not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table goals enable row level security;
alter table user_contexts enable row level security;
alter table sessions enable row level security;
alter table conversation_turns enable row level security;
alter table user_capabilities enable row level security;
alter table recurring_errors enable row level security;
alter table user_memories enable row level security;
alter table consent_records enable row level security;

create policy "users manage their own profile"
  on profiles for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "users manage their own preferences"
  on user_preferences for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage their own goals"
  on goals for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage their own contexts"
  on user_contexts for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage their own sessions"
  on sessions for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage turns of their own sessions"
  on conversation_turns for all
  using (session_id in (
    select s.id from sessions s
    join profiles p on p.id = s.user_id
    where p.auth_user_id = auth.uid()
  ))
  with check (session_id in (
    select s.id from sessions s
    join profiles p on p.id = s.user_id
    where p.auth_user_id = auth.uid()
  ));

create policy "users manage their own capability progress"
  on user_capabilities for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage their own recurring errors"
  on recurring_errors for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage their own memories"
  on user_memories for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "users manage their own consent records"
  on consent_records for all
  using (user_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));
