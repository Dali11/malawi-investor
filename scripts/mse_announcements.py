"""
Malawi Stock Exchange (MSE) corporate announcements scraper.

Source: african-markets.com, which mirrors MSE announcements (dividend
notices, AGM notices, trading statements, interim/annual reports) as plain
HTML with no bot protection -- so this uses a normal `requests` call, no
headless browser needed.

Setup:
    pip install requests beautifulsoup4

Usage:
    python mse_announcements.py                # first ~10 pages
    python mse_announcements.py --pages 50      # more history
    python mse_announcements.py --out ann.csv
"""

import argparse
import csv
import re
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.african-markets.com/en/stock-markets/mse/publications"
PAGE_SIZE = 10  # site paginates in chunks of 10 (start=0,10,20,...)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


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
    """Pull announcement rows (title, size, date, view/download links) out of the page."""
    soup = BeautifulSoup(html, "html.parser")
    rows_out = []

    # Each announcement is a table row with a link whose title looks like
    # "TNM | Unclaimed dividends" and a nearby date string.
    for row in soup.find_all("tr"):
        link = row.find("a", href=True)
        if not link or "/publications/" not in link["href"]:
            continue

        title = link.get_text(strip=True)
        href = link["href"]
        if href.startswith("/"):
            href = "https://www.african-markets.com" + href

        row_text = row.get_text(" ", strip=True)

        # Date pattern like 11-16-2021
        date_match = re.search(r"\d{2}-\d{2}-\d{4}", row_text)
        date = date_match.group(0) if date_match else None

        # File size pattern like "2.55 MB" or "42.01 KB"
        size_match = re.search(r"[\d.]+\s?(KB|MB)", row_text)
        size = size_match.group(0) if size_match else None

        # Ticker prefix before the " | "
        ticker = title.split("|")[0].strip() if "|" in title else None

        rows_out.append(
            {
                "ticker": ticker,
                "title": title,
                "date": date,
                "size": size,
                "url": href,
            }
        )

    return rows_out


def save_csv(rows: list[dict], path: str) -> None:
    if not rows:
        print("No rows scraped -- nothing to save.")
        return
    fieldnames = ["ticker", "title", "date", "size", "url"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Saved {len(rows)} rows to {path}")


def main():
    parser = argparse.ArgumentParser(description="Scrape MSE corporate announcements")
    parser.add_argument(
        "--pages", type=int, default=10, help="How many pages of 10 to fetch"
    )
    parser.add_argument(
        "--delay", type=float, default=1.0, help="Seconds to wait between page requests"
    )
    parser.add_argument(
        "--out",
        default=f"mse_announcements_{datetime.now():%Y%m%d_%H%M%S}.csv",
        help="Output CSV path",
    )
    args = parser.parse_args()

    all_rows = []
    seen_urls = set()

    for page_num in range(args.pages):
        start = page_num * PAGE_SIZE
        print(f"Fetching page {page_num + 1}/{args.pages} (start={start}) ...")
        try:
            html = fetch_page(start)
        except requests.RequestException as e:
            print(f"  request failed: {e}")
            break

        rows = parse_announcements(html)
        if not rows:
            print("  no announcement rows found -- likely reached the end.")
            break

        new_rows = [r for r in rows if r["url"] not in seen_urls]
        if not new_rows:
            print("  all rows already seen -- likely reached the end.")
            break

        for r in new_rows:
            seen_urls.add(r["url"])
        all_rows.extend(new_rows)

        time.sleep(args.delay)  # be polite

    save_csv(all_rows, args.out)


if __name__ == "__main__":
    main()