-- corporate_actions
-- Dividends, AGMs, rights issues, stock splits and other announcements
-- for MSE-listed counters. Manually entered via /admin/corporate-actions
-- (no scraper yet — MSE doesn't publish a clean machine-readable feed
-- for these the way it does for daily prices).
--
-- `type` mirrors the CorporateAction union in
-- components/markets/RecentCorporateActions.tsx — keep both in sync.
--
-- Run this once in the Supabase SQL editor.

create table if not exists corporate_actions (
    id bigint generated always as identity primary key,
    counter_id bigint references mse_counters(id) on delete cascade,
    type text not null check (type in ('Dividend', 'AGM', 'Rights Issue', 'Stock Split', 'Announcement', 'Report')),
    headline text not null,
    details text,
    action_date date not null, -- ex-date / event date / announcement date depending on type
    created_at timestamptz not null default now()
);

create index if not exists corporate_actions_date_idx on corporate_actions (action_date desc);
create index if not exists corporate_actions_counter_idx on corporate_actions (counter_id);

alter table corporate_actions enable row level security;

-- Public can read everything — this is published market info, not
-- gated content like analyses.
create policy "corporate_actions_public_read"
    on corporate_actions for select
    using (true);

-- Writes go through the service role (admin UI uses the anon client
-- today like the analyses table does, so this stays open for now —
-- tighten with an auth.uid() / profiles.membership_tier check once
-- admin auth is added).
create policy "corporate_actions_public_write"
    on corporate_actions for insert
    with check (true);

create policy "corporate_actions_public_update"
    on corporate_actions for update
    using (true);

create policy "corporate_actions_public_delete"
    on corporate_actions for delete
    using (true);
