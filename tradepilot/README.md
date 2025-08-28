# TradePilot

Production-ready React + Vite + TypeScript app to control an n8n-powered trading bot.

## Tech
- React 19, Vite 7, TypeScript
- Tailwind v4 (CSS variables + @theme tokens), WCAG AA-minded components
- React Router, Zustand, Zod
- Chart.js + react-chartjs-2
- Supabase Auth (email+password + magic link)

## Getting started
1. Copy `.env.example` to `.env` and fill values.
2. Install: `npm i`
3. Dev: `npm run dev`  (http://localhost:5173)
4. Build: `npm run build` then `npm run preview`

## Environment
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Scripts
- `dev` — start dev server
- `build` — typecheck + production build
- `preview` — preview production build
- `lint` — eslint

## File structure
- `src/index.css` — design tokens and component primitives (light/dark)
- `src/App.tsx` — layout shell (TopNav, Sidebar, pages)
- `src/components/*` — toasts, charts, etc.
- `src/store/*` — Zustand stores
- `src/lib/supabaseClient.ts` — Supabase client

## Accessibility
- Keyboard-focusable controls with visible focus ring
- Sufficient color contrast (WCAG AA) via tokens
- ARIA attributes on nav/drawer/modal where relevant

## Supabase: minimal schema
Use the SQL below in Supabase SQL editor.

```sql
-- Users are managed by Supabase Auth. We keep a profile table if needed.
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamp with time zone default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  status text not null default 'stopped', -- running|stopped|error
  config jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists strategies_user_idx on public.strategies(user_id);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  strategy_id uuid references public.strategies(id) on delete cascade,
  symbol text not null,
  side text not null, -- LONG|SHORT|BUY|SELL
  qty numeric,
  price numeric,
  pnl numeric,
  ts timestamptz not null default now()
);
create index if not exists trades_user_ts_idx on public.trades(user_id, ts desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  strategy_id uuid references public.strategies(id) on delete cascade,
  type text not null, -- log|fill|signal|error
  message text,
  meta jsonb default '{}',
  ts timestamptz not null default now()
);
create index if not exists events_user_ts_idx on public.events(user_id, ts desc);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  webhook_url text,
  api_key text,
  preferences jsonb default '{}',
  updated_at timestamptz default now()
);

alter table public.strategies enable row level security;
alter table public.trades enable row level security;
alter table public.events enable row level security;
alter table public.settings enable row level security;

create policy strategies_isolation on public.strategies for all
  using (auth.uid() = user_id);
create policy trades_isolation on public.trades for all
  using (auth.uid() = user_id);
create policy events_isolation on public.events for all
  using (auth.uid() = user_id);
create policy settings_isolation on public.settings for all
  using (auth.uid() = user_id);
```

## Auth UX
Implement email/password and magic-link flows using Supabase JS. See `src/lib/supabaseClient.ts`.

## n8n integration
- Use `settings.webhook_url` and `settings.api_key` to call n8n webhooks for Start/Stop.
- Keep calls idempotent; surface toast on success/error.

## Mobile
- Sidebar collapses into drawer
- Sticky CTA bar for Start/Stop strategy (`.mobile-cta`)
