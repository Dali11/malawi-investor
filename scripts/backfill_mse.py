import requests
import re
import time
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(
SUPABASE_URL,
SUPABASE_KEY
)

HEADERS = {
"User-Agent": "Mozilla/5.0"
}

# Matches:

# d("2020-02-24"),17.71

DATA_RE = re.compile(
    r'd\("([^"]+)"\),([0-9.]+)'
)

def backfill_full_history():

    counters_resp = supabase.table("mse_counters").select("*").execute()

    counters = counters_resp.data

    print(f"Loaded {len(counters)} counters")

    total_inserted = 0

    for counter in counters:

        counter_id = counter["id"]
        symbol = counter["symbol"]

        slug = symbol.lower()

        # FDH does not appear to have its own page
        if slug == "fdh":
            print("SKIP FDH")
            continue

        url = f"https://afx.kwayisi.org/chart/mse/{slug}"

        try:

            res = requests.get(
                url,
                headers=HEADERS,
                timeout=20
            )

            res.raise_for_status()

            matches = DATA_RE.findall(
                res.text
            )
            print(f"{symbol}: {len(matches)} matches")

            if not matches:
                print(
                    f"SKIP {symbol}: no data found"
                )
                continue

            existing_rows = (
                supabase.table("mse_prices")
                .select("price_date")
                .eq("counter_id", counter_id)
                .execute()
            )

            existing_dates = {
                row["price_date"]
                for row in existing_rows.data
            }

            rows_to_insert = []

            for price_date, price in matches:

                if price_date in existing_dates:
                    continue

                rows_to_insert.append({
                    "counter_id": counter_id,
                    "price_date": price_date,
                    "price": float(price),
                    "change_pct": None
                })

            inserted = 0

            if rows_to_insert:

                batch_size = 500

                for i in range(
                    0,
                    len(rows_to_insert),
                    batch_size
                ):

                    batch = rows_to_insert[
                        i:i + batch_size
                    ]

                    supabase.table(
                        "mse_prices"
                    ).insert(
                        batch
                    ).execute()

                    inserted += len(batch)

            total_inserted += inserted

            print(
                f"OK {symbol}: "
                f"{len(matches)} history rows found, "
                f"{inserted} inserted"
            )

            time.sleep(0.5)

        except Exception as e:

            print(
                f"FAIL {symbol}: {e}"
            )

    print()
    print("=" * 60)
    print("FULL HISTORY IMPORT COMPLETE")
    print(
        f"TOTAL INSERTED: {total_inserted}"
    )


if __name__ == "__main__":
    backfill_full_history()
