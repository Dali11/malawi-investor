import requests
from bs4 import BeautifulSoup
from supabase import create_client
from datetime import date
from dotenv import load_dotenv
from pathlib import Path
import os
import re

# Resolve relative to this script's location, not the shell's CWD —
# otherwise running from inside scripts/ silently finds nothing.
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

PRICE_RE = re.compile(r"\d[\d,]*\.\d{2}")
SIGNED_RE = re.compile(r"[+-]\d+\.\d{2}")


def scrape_mse():
    url = "https://afx.kwayisi.org/mse/"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "lxml")
    except Exception as e:
        print(f"Failed to fetch page: {e}")
        return

    today = date.today().isoformat()
    updated = 0
    seen = set()

    links = soup.find_all("a", href=re.compile(r"/mse/[a-z0-9\-]+\.html"))

    for link in links:
        symbol = link.get_text(strip=True).upper()

        if " " in symbol or len(symbol) > 10:
            continue
        if any(x in symbol for x in ["MASI", "MDSI", "MFSI", "INDEX"]):
            continue
        if symbol in seen:
            continue

        row = link.find_parent("tr")
        if not row:
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
        # If nothing signed is found at all, the counter likely didn't
        # trade today — change_pct correctly stays None.

        seen.add(symbol)

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

    print(f"\nDone. {updated} counters updated for {today}")


from mse_index_parser import parse_index_rows, parse_trading_date


def scrape_indices():
    """Scrapes MASI/MDSI/MFSI from the daily trading-summary paragraph on
    afx.kwayisi.org/mse/ and upserts one row per index into `mse_indices`.

    Unlike individual counters, MDSI and MFSI are never published as an
    absolute index level by this source — only MASI gets a "close at X"
    figure. MDSI/MFSI rows are stored with value=None and only the
    day/week/YTD % changes filled in.
    """
    url = "https://afx.kwayisi.org/mse/"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "lxml")
    except Exception as e:
        print(f"Failed to fetch page for indices: {e}")
        return

    text = soup.get_text(" ", strip=True)

    # Prefer the trading day printed on the page itself over wall-clock
    # "today" — the scraper may run late, retry, or hit a stale page.
    index_date = parse_trading_date(text) or date.today().isoformat()

    rows = parse_index_rows(text, index_date)

    if not any(r["index_code"] == "MASI" for r in rows):
        print("Couldn't find/parse MASI summary sentence on page")
    for code in ("MDSI", "MFSI"):
        if not any(r["index_code"] == code for r in rows):
            print(f"Couldn't find {code} summary clause — skipping")

    updated = 0
    for row in rows:
        row["source"] = "live_scrape"
        existing = (
            supabase.table("mse_indices")
            .select("id")
            .eq("index_code", row["index_code"])
            .eq("index_date", row["index_date"])
            .execute()
        )
        if existing.data:
            supabase.table("mse_indices") \
                .update(row) \
                .eq("id", existing.data[0]["id"]) \
                .execute()
            print(f"Updated {row['index_code']}: {row}")
        else:
            supabase.table("mse_indices").insert(row).execute()
            print(f"Inserted {row['index_code']}: {row}")
        updated += 1

    print(f"\nDone. {updated} indices updated for {index_date}")


if __name__ == "__main__":
    scrape_mse()
    scrape_indices()