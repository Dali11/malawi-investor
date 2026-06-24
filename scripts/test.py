"""
Daily MSE snapshot scraper — fixed version.

The previous version found ALL links matching /mse/<slug>.html
anywhere on the page (including the "Top Gainers" / "Bottom Losers"
summary widgets near the top, which link to the same pages), then
walked up to the nearest <tr> ancestor. Because the same symbol can
appear in multiple places on the page, and document order isn't
guaranteed to put the real listings-table row first, this sometimes
picked up the wrong price for a counter on a given day.

This version explicitly finds the "Listed companies/securities"
table — identified by being the table that contains the most rows
matching our counters — and only reads prices from rows in that one
table, ignoring the summary widgets entirely.
"""

import requests
from bs4 import BeautifulSoup
from supabase import create_client
from datetime import date
from dotenv import load_dotenv
import os
import re
import sys

load_dotenv(".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PRICE_RE = re.compile(r"\d[\d,]*\.\d{2}")
SIGNED_RE = re.compile(r"[+-]\d+\.\d{2}")
SYMBOL_HREF_RE = re.compile(r"/mse/([a-z0-9\-]+)\.html")

DRY_RUN = "--dry-run" in sys.argv


def find_listings_table(soup: BeautifulSoup):
    """
    The page has multiple <table> elements (gainers widget, losers
    widget, and the full listings table). The real listings table is
    the one with by far the most rows linking to /mse/<slug>.html —
    the summary widgets only show 2-8 rows each, while the full
    listing has all ~16.
    """
    best_table = None
    best_count = 0

    for table in soup.find_all("table"):
        links = table.find_all("a", href=SYMBOL_HREF_RE)
        if len(links) > best_count:
            best_count = len(links)
            best_table = table

    return best_table


def scrape_mse():
    if DRY_RUN:
        print("=== DRY RUN — no database writes will happen ===\n")

    url = "https://afx.kwayisi.org/mse/"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "lxml")
    except Exception as e:
        print(f"Failed to fetch page: {e}")
        return

    listings_table = find_listings_table(soup)
    if listings_table is None:
        print("Could not find the listings table on the page — aborting.")
        return

    today = date.today().isoformat()
    updated = 0
    seen = set()

    rows = listings_table.find_all("tr")

    for row in rows:
        link = row.find("a", href=SYMBOL_HREF_RE)
        if not link:
            continue  # header row or a row with no counter link

        symbol = link.get_text(strip=True).upper()

        if " " in symbol or len(symbol) > 10:
            continue
        if any(x in symbol for x in ["MASI", "MDSI", "MFSI", "INDEX"]):
            continue
        if symbol in seen:
            continue

        row_text = row.get_text(" ", strip=True)

        prices = PRICE_RE.findall(row_text)
        if not prices:
            print(f"Skipping {symbol} — no price pattern in row: {row_text}")
            continue

        try:
            price = float(prices[0].replace(",", ""))
        except Exception:
            print(f"Skipping {symbol} — could not parse price")
            continue

        price_pos = row_text.find(prices[0])
        after_price = row_text[price_pos + len(prices[0]):]
        signed_match = SIGNED_RE.search(after_price)

        change_pct = None
        if signed_match:
            raw_change = float(signed_match.group())
            next_char = after_price[signed_match.end():signed_match.end() + 1]
            if next_char == "%":
                change_pct = raw_change
            else:
                prev_price = price - raw_change
                if prev_price:
                    change_pct = round((raw_change / prev_price) * 100, 2)

        seen.add(symbol)

        if DRY_RUN:
            print(f"[DRY RUN] {symbol}: would write price=MK {price} change_pct={change_pct}")
            updated += 1
            continue

        counter = supabase.table("mse_counters").select("id").eq("symbol", symbol).execute()
        if not counter.data:
            print(f"Not in DB: {symbol}")
            continue

        counter_id = counter.data[0]["id"]

        existing = (
            supabase.table("mse_prices")
            .select("id")
            .eq("counter_id", counter_id)
            .eq("price_date", today)
            .execute()
        )

        if existing.data:
            supabase.table("mse_prices") \
                .update({"price": price, "change_pct": change_pct}) \
                .eq("id", existing.data[0]["id"]) \
                .execute()
            print(f"Updated {symbol}: MK {price} ({change_pct}%)")
        else:
            supabase.table("mse_prices").insert({
                "counter_id": counter_id,
                "price": price,
                "change_pct": change_pct,
                "price_date": today,
            }).execute()
            print(f"Inserted {symbol}: MK {price} ({change_pct}%)")

        updated += 1

    mode = "[DRY RUN] " if DRY_RUN else ""
    print(f"\n{mode}Done. {updated} counters updated for {today} (listings table had {len(rows)} rows)")


if __name__ == "__main__":
    scrape_mse()