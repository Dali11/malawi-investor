-- ipos
-- Upcoming, open, closed and completed initial public offerings on the
-- Malawi Stock Exchange. Manually entered via /admin/ipos (no scraper —
-- MSE doesn't publish a machine-readable IPO calendar).
--
-- counter_id is nullable because a company usually doesn't have an
-- `mse_counters` row until it actually lists — link it once the IPO
-- status moves to 'Listed'.
--
-- `status` mirrors the IpoStatus union in app/(public)/markets/ipos —
-- keep both in sync.
--
-- Run this once in the Supabase SQL editor.

create table if not exists ipos (
    id bigint generated always as identity primary key,
    counter_id bigint references mse_counters(id) on delete set null,
    company_name text not null,
    sector text,
    status text not null check (status in ('Upcoming', 'Open', 'Closed', 'Listed')),
    offer_price numeric,        -- MWK per share
    shares_offered bigint,      -- total shares on offer
    min_investment numeric,     -- MWK, minimum application amount
    open_date date,             -- subscription window opens
    close_date date,            -- subscription window closes
    listing_date date,          -- expected / actual date of listing on the MSE
    summary text not null,      -- one or two sentence blurb shown in the list
    details text,               -- longer context: use of proceeds, how to apply, etc.
    prospectus_url text,        -- link to the prospectus / offer document, if public
    created_at timestamptz not null default now()
);

create index if not exists ipos_status_idx on ipos (status);
create index if not exists ipos_listing_date_idx on ipos (listing_date desc);
create index if not exists ipos_counter_idx on ipos (counter_id);

alter table ipos enable row level security;

-- Public can read everything — this is published market info.
create policy "ipos_public_read"
    on ipos for select
    using (true);

-- Writes go through the anon client from the admin UI today, same as
-- corporate_actions — tighten with an auth.uid() / profiles.membership_tier
-- check once admin auth is added.
create policy "ipos_public_write"
    on ipos for insert
    with check (true);

create policy "ipos_public_update"
    on ipos for update
    using (true);

create policy "ipos_public_delete"
    on ipos for delete
    using (true);
