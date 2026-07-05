-- Adds author_id so a published analysis can display who actually wrote
-- it, instead of a hardcoded name in the UI (app/admin/page.tsx,
-- app/(public)/research/page.tsx and app/(public)/research/[id]/page.tsx
-- previously had three separate hardcoded strings that had drifted out
-- of sync — "Bena Nkhoma" in two places, "Dali Kamphani" in the third).
--
-- References profiles(id), which mirrors auth.users(id) one-to-one
-- (see app/(dashboard)/layout.tsx: `.from('profiles').eq('id', user.id)`).
-- This lets Supabase/PostgREST embed the author directly, e.g.
-- `.select('..., profiles(full_name)')`.
alter table analyses
add column if not exists author_id uuid references profiles(id);

-- Optional one-time backfill for existing rows, which will otherwise
-- show the fallback name in the UI ("Bena Nkhoma") since they predate
-- this column. Replace the email with the real admin account and run:
--
-- update analyses
-- set author_id = (select id from profiles where email = 'REPLACE_WITH_ADMIN_EMAIL')
-- where author_id is null;
