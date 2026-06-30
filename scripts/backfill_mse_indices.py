# scripts/backfill_mse_indices.py
#
# Recovers historical MASI/MDSI/MFSI snapshots from the Wayback
# Machine's archived copies of afx.kwayisi.org/mse/, since that site
# only ever shows "today" — there's no historical chart endpoint for
# the indices themselves (unlike individual counters, which have
# /chart/mse/{slug} — see backfill_mse.py).
#
# Coverage is whatever the Wayback Machine happened to crawl, which is
# usually sparse and irregular (days or weeks apart, not necessarily
# every trading day). Treat this as "recover what we can", not a
# complete history. Rows inserted this way are tagged
# source='wayback_backfill' so they're easy to distinguish/audit later.
#
# Requires network access to web.archive.org — run this from your own
# machine/CI, not a sandboxed environment with restricted egress.

import os
import sys
import time
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, os.path.dirname(__file__))
from mse_index_parser import parse_index_rows, parse_trading_date  # noqa: E402

# Resolve .env.local relative to the project root (one level up from
# scripts/), not the shell's current working directory — otherwise
# this silently no-ops if you `cd scripts` first and run it from there.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit(
        f"Missing Supabase credentials. Expected to find NEXT_PUBLIC_SUPABASE_URL "
        f"and SUPABASE_SERVICE_ROLE_KEY in {PROJECT_ROOT / '.env.local'} — "
        f"check that file exists and has both values set."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TARGET_URL = "afx.kwayisi.org/mse/"
CDX_API = "http://web.archive.org/cdx/search/cdx"
HEADERS = {"User-Agent": "Mozilla/5.0"}

# How far back to look. Adjust as needed — afx.kwayisi.org itself may
# not have existed/been crawled before a certain year, so very old
# `from_year` values will just come back empty rather than error.
FROM_YEAR = 2018
TO_YEAR = 2026


def list_snapshots():
    """Queries the Wayback CDX API for every crawl of the target page,
    collapsed to at most one per calendar day (the source page is a
    "today" snapshot anyway, so multiple crawls on the same day are
    redundant). Returns a list of (timestamp, archived_url) tuples,
    oldest first.
    """
    params = {
        "url": TARGET_URL,
        "output": "json",
        "filter": "statuscode:200",
        "collapse": "timestamp:8",  # one capture per YYYYMMDD
        "from": f"{FROM_YEAR}0101",
        "to": f"{TO_YEAR}1231",
    }
    res = requests.get(CDX_API, params=params, headers=HEADERS, timeout=30)
    res.raise_for_status()
    rows = res.json()

    if not rows or len(rows) < 2:
        return []

    # First row is the header (["urlkey", "timestamp", "original", ...])
    header = rows[0]
    ts_idx = header.index("timestamp")
    orig_idx = header.index("original")

    snapshots = []
    for row in rows[1:]:
        ts = row[ts_idx]
        original = row[orig_idx]
        archived_url = f"https://web.archive.org/web/{ts}/{original}"
        snapshots.append((ts, archived_url))

    return snapshots


def backfill():
    snapshots = list_snapshots()
    print(f"Found {len(snapshots)} archived snapshots to check")

    inserted = 0
    skipped_existing = 0
    skipped_unparseable = 0

    for ts, archived_url in snapshots:
        try:
            res = requests.get(archived_url, headers=HEADERS, timeout=20)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, "lxml")
            text = soup.get_text(" ", strip=True)
        except Exception as e:
            print(f"FAIL fetching {archived_url}: {e}")
            time.sleep(1)
            continue

        # Trust the date printed in the page text, not the Wayback
        # crawl timestamp — a crawl can happen hours after the page's
        # content was actually generated.
        index_date = parse_trading_date(text)
        if not index_date:
            print(f"SKIP {ts}: couldn't find a trading-summary date on the page")
            skipped_unparseable += 1
            time.sleep(1)
            continue

        rows = parse_index_rows(text, index_date)
        if not rows:
            print(f"SKIP {ts} ({index_date}): no index rows parsed")
            skipped_unparseable += 1
            time.sleep(1)
            continue

        for row in rows:
            row["source"] = "wayback_backfill"

            existing = (
                supabase.table("mse_indices")
                .select("id, source")
                .eq("index_code", row["index_code"])
                .eq("index_date", row["index_date"])
                .execute()
            )

            if existing.data:
                # Never let a backfilled row clobber a live-scraped one —
                # live data for the same date is always more trustworthy.
                if existing.data[0]["source"] == "live_scrape":
                    skipped_existing += 1
                    continue
                supabase.table("mse_indices") \
                    .update(row) \
                    .eq("id", existing.data[0]["id"]) \
                    .execute()
            else:
                supabase.table("mse_indices").insert(row).execute()
                inserted += 1

        print(f"OK {index_date}: {[r['index_code'] for r in rows]}")
        time.sleep(1)  # be polite to archive.org

    print()
    print("=" * 60)
    print("BACKFILL COMPLETE")
    print(f"Rows inserted/updated: {inserted}")
    print(f"Skipped (already had live data): {skipped_existing}")
    print(f"Skipped (unparseable snapshot): {skipped_unparseable}")


if __name__ == "__main__":
    backfill()
