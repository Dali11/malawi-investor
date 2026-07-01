# scripts/extract_corporate_action_details.py
#
# Second pass over `corporate_actions`, run after scrape_corporate_actions.py.
# That first pass only captures the announcement title (e.g. "Trading
# statement", "Unclaimed dividends") plus a link to the PDF — the actual
# substance (dividend amount, ex-dividend/payment dates, AGM venue/time)
# lives inside the PDF itself. This script downloads each row's PDF,
# extracts its text, and fills in `details`:
#   - Dividend rows: tries to pull amount-per-share + ex-date + payment
#     date via regex, and prepends that as a structured summary line.
#   - Everything else: stores a cleaned excerpt of the PDF's text
#     (first ~800 chars of real content, skipping boilerplate headers).
#
# This is best-effort — MSE announcement PDFs are inconsistently
# formatted (some are scanned images, some are two-column layouts,
# some are announcement letters, some are financial statements).
# Where extraction fails or looks unreliable, it leaves `details` as
# null rather than guessing, and logs it so you can review manually.
#
# Usage:
#   python extract_corporate_action_details.py                # process rows with details still null
#   python extract_corporate_action_details.py --limit 20      # just the first 20 (useful for testing)
#   python extract_corporate_action_details.py --dry-run       # print what would be extracted, don't write

import argparse
import io
import os
import re
import time
from pathlib import Path

import pdfplumber
import requests
from dotenv import load_dotenv
from supabase import create_client

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

MAX_PDF_BYTES = 15 * 1024 * 1024  # skip anything absurdly large — not a normal filing
MAX_PAGES_READ = 5  # the info we need is always in the first few pages
EXCERPT_LENGTH = 800

# A flexible date phrase: "Wednesday, 4th February 2026", "4th February 2026",
# or "February 4, 2026" — MSE filings aren't consistent about weekday prefixes
# or ordinal suffixes, so this covers the common real-world variants.
DATE_PHRASE = r"(?:[A-Za-z]+day,?\s*)?\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}"

# Specifically requires "per share" immediately after the number — this is
# what distinguishes the actual per-share dividend from the aggregate payout
# total (e.g. "K50.032 billion (K7.25 per share)" — without requiring "per
# share", the regex previously matched the billion figure instead).
DIVIDEND_AMOUNT_RE = re.compile(
    r"(?:MK|MWK|K)\s*([\d,]+\.\d{1,3})\s*per share",
    re.IGNORECASE,
)

# Real filings say "will trade ex-dividend from <date>", not the generic
# "Ex-dividend date:" label originally assumed here.
EX_DATE_RE = re.compile(
    rf"(?:ex[- ]dividend (?:date|from)|trade ex-dividend from)[:\s]*({DATE_PHRASE})",
    re.IGNORECASE,
)

# Similarly, real filings say "will be paid on <date>" / "paid on <date>",
# not always the literal "Payment date:" label.
PAYMENT_DATE_RE = re.compile(
    rf"(?:payment date|will be paid on|paid on)[:\s]*({DATE_PHRASE})",
    re.IGNORECASE,
)


def fetch_pdf_bytes(url: str) -> bytes | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        resp.raise_for_status()
        content_length = int(resp.headers.get("content-length", 0))
        if content_length and content_length > MAX_PDF_BYTES:
            print(f"  SKIP: file too large ({content_length} bytes)")
            return None
        return resp.content
    except requests.RequestException as e:
        print(f"  FAIL downloading: {e}")
        return None


def extract_text(pdf_bytes: bytes) -> str | None:
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages[:MAX_PAGES_READ]:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            return "\n".join(pages_text) if pages_text else None
    except Exception as e:
        print(f"  FAIL parsing PDF: {e}")
        return None


def clean_excerpt(text: str) -> str:
    # Collapse whitespace/line breaks, drop the excerpt to a readable length
    # at a word boundary rather than mid-word.
    collapsed = re.sub(r"\s+", " ", text).strip()
    if len(collapsed) <= EXCERPT_LENGTH:
        return collapsed
    cut = collapsed.rfind(" ", 0, EXCERPT_LENGTH)
    if cut == -1:
        cut = EXCERPT_LENGTH
    return collapsed[:cut] + "…"


def build_dividend_summary(text: str) -> str | None:
    """Best-effort structured line for Dividend-type rows. Returns None
    if we can't confidently find an amount — better to fall back to the
    generic excerpt than print a wrong number.
    """
    amount_match = DIVIDEND_AMOUNT_RE.search(text)
    if not amount_match:
        return None

    parts = [f"Dividend: K{amount_match.group(1)} per share"]

    ex_match = EX_DATE_RE.search(text)
    if ex_match:
        parts.append(f"Ex-dividend date: {ex_match.group(1)}")

    pay_match = PAYMENT_DATE_RE.search(text)
    if pay_match:
        parts.append(f"Payment date: {pay_match.group(1)}")

    return " | ".join(parts)


def build_details(row_type: str, text: str) -> str:
    if row_type == "Dividend":
        summary = build_dividend_summary(text)
        if summary:
            excerpt = clean_excerpt(text)
            return f"{summary}\n\n{excerpt}"
    return clean_excerpt(text)


def process(limit: int | None, dry_run: bool, delay: float):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise SystemExit(
            f"Missing Supabase credentials. Expected NEXT_PUBLIC_SUPABASE_URL "
            f"and SUPABASE_SERVICE_ROLE_KEY in {PROJECT_ROOT / '.env.local'}."
        )

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    query = (
        supabase.table("corporate_actions")
        .select("id, type, headline, source_url")
        .is_("details", "null")
        .not_.is_("source_url", "null")
    )
    if limit:
        query = query.limit(limit)

    rows = query.execute().data
    print(f"Found {len(rows)} rows with a PDF link but no extracted details.\n")

    updated = 0
    failed = 0

    for row in rows:
        print(f"[{row['id']}] {row['type']} — {row['headline']} ({row['source_url']})")

        pdf_bytes = fetch_pdf_bytes(row["source_url"])
        if pdf_bytes is None:
            failed += 1
            time.sleep(delay)
            continue

        text = extract_text(pdf_bytes)
        if not text:
            print("  SKIP: no extractable text (likely a scanned/image-only PDF)")
            failed += 1
            time.sleep(delay)
            continue

        details = build_details(row["type"], text)
        print(f"  -> {details[:120]}...")

        if not dry_run:
            supabase.table("corporate_actions").update({"details": details}).eq(
                "id", row["id"]
            ).execute()

        updated += 1
        time.sleep(delay)

    print()
    print("=" * 60)
    print(f"Updated: {updated}")
    print(f"Failed/skipped: {failed}")
    if dry_run:
        print("(--dry-run set — no rows were actually written)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract PDF content into corporate_actions.details")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N rows")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between PDF downloads")
    parser.add_argument("--dry-run", action="store_true", help="Print extracted details without writing")
    args = parser.parse_args()

    process(limit=args.limit, dry_run=args.dry_run, delay=args.delay)