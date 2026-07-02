-- scripts/corporate_actions_add_report_type_migration.sql
-- scrape_corporate_actions.py's classify_type() has always been able to
-- return "Report" (interim/annual/abridged reports, financial statements)
-- but the original check constraint never included it — any such row
-- has been silently failing to insert. Widen the constraint to match
-- what the classifier actually produces.
--
-- Run this once in the Supabase SQL editor.

alter table corporate_actions
    drop constraint if exists corporate_actions_type_check;

alter table corporate_actions
    add constraint corporate_actions_type_check
    check (type in ('Dividend', 'AGM', 'Rights Issue', 'Stock Split', 'Announcement', 'Report'));
