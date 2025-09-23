-- Infinite challenge mode tables for Supabase
create extension if not exists "pgcrypto";

-- Game session log
create table if not exists public.infinite_game_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    question_id text,
    question_level integer not null,
    question_text text not null,
    correct_answer numeric not null,
    won boolean not null default false,
    total_guesses integer not null,
    guesses jsonb,
    run_level integer,
    highest_level_completed integer,
    completed_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_infinite_game_sessions_user
    on public.infinite_game_sessions(user_id);

-- Aggregated stats per user
create table if not exists public.infinite_user_stats (
    user_id uuid primary key references auth.users(id),
    runs_started integer not null default 0,
    best_level integer not null default 0,
    longest_streak integer not null default 0,
    questions_attempted integer not null default 0,
    questions_correct integer not null default 0,
    total_guesses integer not null default 0,
    accuracy numeric(6,4) not null default 0,
    updated_at timestamptz not null default now()
);
