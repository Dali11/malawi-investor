"""
Malawi Stock Exchange (MSE) daily share price scraper.

Uses a real headless browser (Playwright) instead of a plain HTTP client,
because mse.co.mw sits behind basic bot-detection that blocks simple
requests-style fetches. This just renders the page like a normal browser
would and reads the public share-price table — no auth bypass, no CAPTCHA
solving, nothing adversarial.

Setup:
    pip install playwright beautifulsoup4
    playwright install chromium

Usage:
    python mse_scraper.py
    python mse_scraper.py --out prices.csv
"""

import argparse
import csv
import sys
import time
from datetime import datetime

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

MAINBOARD_URL = "https://mse.co.mw/market/mainboard"

# A realistic, current desktop Chrome UA. Update if the site starts
# fingerprinting more aggressively.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def fetch_rendered_html(
    url: str, wait_selector: str = "table", timeout_ms: int = 30000, debug: bool = False
) -> str:
    """Load `url` in a real headless browser and return the rendered HTML."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1366, "height": 900},
            locale="en-US",
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle", timeout=timeout_ms)

        # Give any client-side table rendering a moment to finish.
        try:
            page.wait_for_selector(wait_selector, timeout=timeout_ms)
        except Exception:
            pass  # fall through; we'll just parse whatever loaded

        if debug:
            page.screenshot(path="debug_screenshot.png", full_page=True)
            print("Saved debug_screenshot.png")

        html = page.content()
        browser.close()
        return html


def parse_price_table(html: str) -> list[dict]:
    """Parse the share-price table out of the rendered HTML.

    Table structure can change without notice — if this returns nothing,
    open the page in a real browser, inspect the table, and adjust the
    selectors below.
    """
    soup = BeautifulSoup(html, "html.parser")
    rows_out = []

    table = soup.find("table")
    if table is None:
        return rows_out

    headers = [th.get_text(strip=True) for th in table.find_all("th")]

    for tr in table.find_all("tr"):
        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        if not cells:
            continue
        if headers and len(headers) == len(cells):
            rows_out.append(dict(zip(headers, cells)))
        else:
            rows_out.append({"raw": cells})

    return rows_out


def save_csv(rows: list[dict], path: str) -> None:
    if not rows:
        print("No rows scraped — nothing to save.")
        return
    fieldnames = sorted({k for row in rows for k in row.keys()})
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Saved {len(rows)} rows to {path}")


def main():
    parser = argparse.ArgumentParser(description="Scrape MSE daily share prices")
    parser.add_argument("--url", default=MAINBOARD_URL, help="Page to scrape")
    parser.add_argument(
        "--out",
        default=f"mse_prices_{datetime.now():%Y%m%d_%H%M%S}.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--retries", type=int, default=3, help="Retries if the page fails to load"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Save debug.html and debug_screenshot.png of the rendered page",
    )
    args = parser.parse_args()

    html = None
    last_err = None
    for attempt in range(1, args.retries + 1):
        try:
            print(f"Attempt {attempt}/{args.retries}: loading {args.url} ...")
            html = fetch_rendered_html(args.url, debug=args.debug)
            break
        except Exception as e:
            last_err = e
            print(f"  failed: {e}")
            time.sleep(3 * attempt)  # back off a bit between retries

    if html is None:
        print(f"Could not load the page after {args.retries} attempts: {last_err}")
        sys.exit(1)

    if args.debug:
        with open("debug.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Saved debug.html")

    rows = parse_price_table(html)
    if not rows:
        print(
            "Parsed 0 rows. The page structure may differ from what this script "
            "expects, or it rendered without the table this time. Try saving "
            "`html` to a file and inspecting it."
        )

    save_csv(rows, args.out)


if __name__ == "__main__":
    main()