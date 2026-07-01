-- news_items
-- Short-form news headlines — market wire, press releases, MSE circulars,
-- newspaper coverage. Deliberately separate from `analyses` (the
-- long-form research/commentary content that powers /research):
-- news_items are quick factual headlines with a source link, not
-- full articles with an author byline.
--
-- Run this once in the Supabase SQL editor.

create table if not exists news_items (
    id bigint generated always as identity primary key,
    counter_id bigint references mse_counters(id) on delete set null,
    headline text not null,
    summary text,               -- one or two sentence blurb, optional
    source_name text,           -- e.g. "Nyasa Times", "MSE", "Reuters"
    source_url text,            -- link to the original piece, if public
    published_at date not null,
    created_at timestamptz not null default now()
);

create index if not exists news_items_published_idx on news_items (published_at desc);
create index if not exists news_items_counter_idx on news_items (counter_id);

alter table news_items enable row level security;

create policy "news_items_public_read"
    on news_items for select
    using (true);

-- Writes go through the anon client from the admin UI today, same as
-- corporate_actions/ipos — tighten once admin auth is added.
create policy "news_items_public_write"
    on news_items for insert
    with check (true);

create policy "news_items_public_update"
    on news_items for update
    using (true);

create policy "news_items_public_delete"
    on news_items for delete
    using (true);
