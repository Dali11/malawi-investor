# scripts/scrape_corporate_actions.py
#
# Scrapes MSE corporate announcements — dividend notices, AGM notices,
# trading statements, rights issues, and other filings — from
# african-markets.com and upserts them into `corporate_actions`.
#
# mse.co.mw itself sits behind a Sucuri/GoDaddy bot-detection CAPTCHA
# that blocks automated access entirely, so this uses african-markets.com
# instead, which mirrors the same announcements as plain HTML with no
# such gate — same source africanmarkets aggregates from, just without
# the wall in front of it.
#
# Run corporate_actions_add_source_migration.sql once before running
# this, if your corporate_actions table predates the source_url column.
#
# Usage:
#   python scrape_corporate_actions.py                # first 10 pages (~100 rows)
#   python scrape_corporate_actions.py --pages 50      # deeper history
#   python scrape_corporate_actions.py --dry-run       # parse only, don't write to Supabase

import argparse
import os
import re
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

BASE_URL = "https://www.african-markets.com/en/stock-markets/mse/publications"
PAGE_SIZE = 10

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

# Keyword -> corporate_actions.type. Checked in order, first match wins,
# so put more specific phrases before generic ones.
TYPE_RULES = [
    (r"\bagm\b|annual general meeting", "AGM"),
    (r"\brights issue\b", "Rights Issue"),
    (r"\bstock split\b|\bshare split\b", "Stock Split"),
    (r"interim report|annual report|abridged report|financial statement", "Report"),
    (r"dividend", "Dividend"),
]


def classify_type(title: str) -> str:
    lowered = title.lower()
    for pattern, action_type in TYPE_RULES:
        if re.search(pattern, lowered):
            return action_type
    return "Announcement"


def fetch_page(start: int) -> str:
    resp = requests.get(
        BASE_URL,
        params={"layout": "table", "start": start},
        headers=HEADERS,
        timeout=20,
    )
    resp.raise_for_status()
    return resp.text


def parse_announcements(html: str) -> list[dict]:
    """Same row-parsing logic as the standalone mse_announcements.py,
    plus type classification and ticker extraction ready for DB insert.
    """
    soup = BeautifulSoup(html, "html.parser")
    rows_out = []

    for row in soup.find_all("tr"):
        link = row.find("a", href=True)
        if not link or "/publications/" not in link["href"]:
            continue

        title = link.get_text(strip=True)
        href = link["href"]
        if href.startswith("/"):
            href = "https://www.african-markets.com" + href

        row_text = row.get_text(" ", strip=True)

        date_match = re.search(r"(\d{2})-(\d{2})-(\d{4})", row_text)
        if not date_match:
            continue
        mm, dd, yyyy = date_match.groups()
        action_date = f"{yyyy}-{mm}-{dd}"  # ISO, for Postgres `date`

        ticker = title.split("|")[0].strip() if "|" in title else None
        headline = title.split("|", 1)[1].strip() if "|" in title else title

        rows_out.append(
            {
                "ticker": ticker,
                "headline": headline,
                "action_date": action_date,
                "source_url": href,
                "type": classify_type(headline),
            }
        )

    return rows_out


def build_ticker_lookup(supabase) -> tuple[dict, set]:
    """Maps counter symbol -> id, case-insensitive.

    Returns (lookup, no_counter_tickers). Announcements whose ticker
    isn't in `lookup` are held out of the insert rather than written
    with counter_id=None, UNLESS the ticker is in `no_counter_tickers`
    (explicit allowlist for genuinely counter-less notices, e.g. "MSE"
    itself for exchange-wide announcements).

    Why hold out rather than insert-with-null: "unmatched" can mean
    either (a) a genuine MSE code mismatch — fix via ALIASES below once
    confirmed — or (b) the feed occasionally includes announcements for
    companies on OTHER exchanges entirely (confirmed: EMTL/MTMD are
    Mauritius Stock Exchange tickers, not MSE — likely a categorization
    issue on african-markets.com's side). We can't tell (a) from (b)
    automatically, and inserting (b) would put another exchange's
    announcement into your MSE corporate_actions table, so unmatched
    tickers are skipped and logged for manual review instead.
    """
    resp = supabase.table("mse_counters").select("id, symbol").execute()
    lookup = {row["symbol"].upper(): row["id"] for row in resp.data}

    # african-markets.com uses different ticker codes than mse_counters
    # for a handful of counters. Confirmed via africanmarkets.com's own
    # /listed-companies page (?code=... in company links):
    #   NBSMW -> NBS Bank (mse_counters symbol: NBS)
    # Add more pairs here as they turn up — check with:
    #   select headline, source_url from corporate_actions where counter_id is null;
    ALIASES = {
        "NBSMW": "NBS",
    }
    for alias, real_symbol in ALIASES.items():
        if real_symbol.upper() in lookup:
            lookup[alias] = lookup[real_symbol.upper()]

    NO_COUNTER_TICKERS = {"MSE"}

    return lookup, NO_COUNTER_TICKERS


def scrape_corporate_actions(pages: int, delay: float, dry_run: bool):
    all_rows = []
    seen_urls = set()

    for page_num in range(pages):
        start = page_num * PAGE_SIZE
        print(f"Fetching page {page_num + 1}/{pages} (start={start}) ...")
        try:
            html = fetch_page(start)
        except requests.RequestException as e:
            print(f"  request failed: {e}")
            break

        rows = parse_announcements(html)
        if not rows:
            print("  no rows found — likely reached the end.")
            break

        new_rows = [r for r in rows if r["source_url"] not in seen_urls]
        if not new_rows:
            print("  all rows already seen — likely reached the end.")
            break

        for r in new_rows:
            seen_urls.add(r["source_url"])
        all_rows.extend(new_rows)

        time.sleep(delay)

    print(f"\nParsed {len(all_rows)} announcement rows total.")

    if dry_run:
        for r in all_rows[:20]:
            print(r)
        print("\n--dry-run set, not writing to Supabase.")
        return

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise SystemExit(
            f"Missing Supabase credentials. Expected NEXT_PUBLIC_SUPABASE_URL "
            f"and SUPABASE_SERVICE_ROLE_KEY in {PROJECT_ROOT / '.env.local'}."
        )

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    ticker_lookup, no_counter_tickers = build_ticker_lookup(supabase)

    inserted = 0
    skipped_existing = 0
    held_for_review = []

    for row in all_rows:
        counter_id = None
        ticker = row["ticker"].upper() if row["ticker"] else None

        if ticker:
            if ticker in ticker_lookup:
                counter_id = ticker_lookup[ticker]
            elif ticker not in no_counter_tickers:
                held_for_review.append(row)
                continue  # don't insert — see build_ticker_lookup docstring

        existing = (
            supabase.table("corporate_actions")
            .select("id")
            .eq("source_url", row["source_url"])
            .execute()
        )
        if existing.data:
            skipped_existing += 1
            continue

        supabase.table("corporate_actions").insert(
            {
                "counter_id": counter_id,
                "type": row["type"],
                "headline": row["headline"],
                "details": None,
                "action_date": row["action_date"],
                "source_url": row["source_url"],
                "source": "scrape_african_markets",
            }
        ).execute()
        inserted += 1

    print()
    print("=" * 60)
    print(f"Inserted: {inserted}")
    print(f"Skipped (already in DB): {skipped_existing}")
    if held_for_review:
        print(f"Held for review (unrecognized ticker, NOT inserted): {len(held_for_review)}")
        for row in held_for_review:
            print(f"  {row['ticker']} — {row['headline']} — {row['source_url']}")
        print(
            "\nFor each: confirm it's really an MSE-listed counter (add to ALIASES "
            "in build_ticker_lookup) or a genuine exchange-wide notice (add to "
            "NO_COUNTER_TICKERS) or a foreign/bad row to ignore permanently."
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape MSE corporate announcements")
    parser.add_argument("--pages", type=int, default=10, help="How many pages of 10 to fetch")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between page requests")
    parser.add_argument(
        "--dry-run", action="store_true", help="Parse and print only, don't write to Supabase"
    )
    args = parser.parse_args()

    scrape_corporate_actions(pages=args.pages, delay=args.delay, dry_run=args.dry_run)