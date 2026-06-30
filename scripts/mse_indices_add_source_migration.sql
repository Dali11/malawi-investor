-- scripts/mse_indices_add_source_migration.sql
-- Run this ONLY if you already created mse_indices from an earlier
-- version of mse_indices_schema.sql (i.e. it doesn't have `source`
-- yet). If you're creating the table fresh, just use
-- mse_indices_schema.sql instead — it already includes this column.

alter table mse_indices
    add column if not exists source text not null default 'live_scrape'
    check (source in ('live_scrape', 'wayback_backfill'));
