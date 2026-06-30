-- mse_indices
-- Daily snapshot of MSE benchmark indices, scraped from afx.kwayisi.org/mse/.
--
-- Only MASI (Malawi All Share Index) is published as an absolute index
-- level by that source — MDSI (Domestic) and MFSI (Foreign) only ever
-- appear as % changes in the daily trading-summary paragraph, so `value`
-- and `market_cap` are nullable and will stay null for those two rows.
--
-- `source` tracks provenance: 'live_scrape' (today, run via cron) vs
-- 'wayback_backfill' (historical rows recovered from web.archive.org).
-- Useful for spotting data-quality issues that only show up in one
-- source or the other.
--
-- Run this once in the Supabase SQL editor before running scrape_mse.py.

create table if not exists mse_indices (
    id bigint generated always as identity primary key,
    index_code text not null check (index_code in ('MASI', 'MDSI', 'MFSI')),
    value numeric,
    day_change_pct numeric,
    week_change_pct numeric,
    ytd_change_pct numeric,
    market_cap numeric,
    index_date date not null,
    source text not null default 'live_scrape' check (source in ('live_scrape', 'wayback_backfill')),
    unique (index_code, index_date)
);

create index if not exists mse_indices_date_idx on mse_indices (index_date);
