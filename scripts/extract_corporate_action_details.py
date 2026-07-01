# scripts/extract_corporate_action_details.py
#
# Second pass over `corporate_actions`, run after scrape_corporate_actions.py.
# That first pass only captures the announcement title (e.g. "Trading
# statement", "Unclaimed dividends") plus a link to the PDF — the actual
# substance (dividend amount, ex-dividend/payment dates, AGM venue/time)
# lives inside the PDF itself. This script downloads each row's PDF and:
#   1. Extracts text and fills in `details`:
#      - Dividend rows: tries to pull amount-per-share + ex-date + payment
#        date via regex, and prepends that as a structured summary line.
#      - Everything else: stores a cleaned excerpt of the PDF's text
#        (first ~800 chars of real content, skipping boilerplate headers).
#      - If the PDF has no text layer (confirmed to happen regularly —
#        several NICO filings are scanned images), falls back to OCR via
#        pytesseract. OCR results are prefixed "[OCR — verify against
#        PDF]" since OCR can misread digits, which matters a lot for the
#        dividend-amount regex above — treat OCR'd numbers as provisional
#        until spot-checked, the same way we caught the FDHB amount bug.
#   2. Uploads the PDF itself to the `corporate-action-pdfs` Supabase
#      Storage bucket and sets `pdf_storage_path`, so /markets/corporate-
#      actions/[slug] can offer a "Download PDF" link hosted on your own
#      platform instead of pointing back to african-markets.com.
#   3. Sets `slug` if it isn't already set, for the [slug] route.
#
# This is best-effort — MSE announcement PDFs are inconsistently
# formatted (some are scanned images, some are two-column layouts,
# some are announcement letters, some are financial statements).
# Where text extraction fails or looks unreliable, `details` is left
# null rather than guessing, and it's logged so you can review manually.
# The PDF is still uploaded and `pdf_storage_path` still set even when
# text extraction fails, so a download link is available either way.
#
# Requires: corporate_actions_add_slug_and_pdf_migration.sql run first,
# AND a Storage bucket named "corporate-action-pdfs" created (set to
# Public) in the Supabase dashboard — see that migration file's comments.
#
# For OCR support (scanned PDFs), also needs the tesseract-ocr system
# binary, not just the pytesseract Python package:
#   pip install pytesseract pillow
#   Windows: https://github.com/UB-Mannheim/tesseract/wiki
#   Mac:     brew install tesseract
#   Linux:   apt install tesseract-ocr
# Without it, OCR is silently skipped and scanned PDFs just get their
# PDF stored with details left null, same as before OCR support existed.
#
# Usage:
#   python extract_corporate_action_details.py                # process rows with details still null
#   python extract_corporate_action_details.py --limit 20      # just the first 20 (useful for testing)
#   python extract_corporate_action_details.py --dry-run       # print what would happen, don't write/upload

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

try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

STORAGE_BUCKET = "corporate-action-pdfs"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

MAX_PDF_BYTES = 15 * 1024 * 1024  # skip anything absurdly large — not a normal filing
MAX_PAGES_READ = 5  # the info we need is always in the first few pages
MAX_OCR_PAGES = 3  # OCR is slow — cap tighter than regular text extraction
OCR_RESOLUTION_SCALE = 2.0  # ~150 DPI equivalent, matches pdf-reading skill guidance
EXCERPT_LENGTH = 800

# A flexible date phrase: "Wednesday, 4th February 2026", "17th of December 2025",
# or "February 4, 2026" — MSE filings aren't consistent about weekday prefixes,
# ordinal suffixes, or an "of" between day and month.
DATE_PHRASE = r"(?:[A-Za-z]+day,?\s*)?\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?[A-Za-z]+\s+\d{4}"

# Specifically requires "per share" immediately after the number — this is
# what distinguishes the actual per-share dividend from the aggregate payout
# total (e.g. "K50.032 billion (K7.25 per share)" — without requiring "per
# share", the regex previously matched the billion figure instead).
DIVIDEND_AMOUNT_RE = re.compile(
    r"(?:MK|MWK|K)\s*([\d,]+\.\d{1,3})\s*per share",
    re.IGNORECASE,
)

# Real filings phrase this multiple ways: "will trade ex-dividend from
# <date>", or "the ex-dividend date is <date>" — the "is" here isn't
# whitespace, so the connector needs to allow it explicitly rather than
# just [:\s]*.
EX_DATE_RE = re.compile(
    rf"(?:ex[- ]dividend (?:date|from)|trade ex-dividend from)\s*(?:is|:)?\s*({DATE_PHRASE})",
    re.IGNORECASE,
)

# Similarly: "will be paid on <date>", "paid on <date>", or "payable on
# <date>" all appear across different filings.
PAYMENT_DATE_RE = re.compile(
    rf"(?:payment date|will be paid on|paid on|payable on)[:\s]*({DATE_PHRASE})",
    re.IGNORECASE,
)


def slugify(headline: str, row_id: int) -> str:
    # id-suffixed because headlines like "Trading statement" repeat across
    # many rows/years for the same and different counters — headline text
    # alone isn't unique.
    base = re.sub(r"[^a-zA-Z0-9]+", "-", headline.lower()).strip("-")
    return f"{base}-{row_id}"


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


def upload_pdf(supabase, pdf_bytes: bytes, slug: str) -> str | None:
    """Uploads to Storage, returns the storage path (not the full URL —
    the frontend builds the public URL from this path + bucket name).
    """
    path = f"{slug}.pdf"
    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path,
            pdf_bytes,
            {"content-type": "application/pdf", "upsert": "true"},
        )
        return path
    except Exception as e:
        print(f"  FAIL uploading PDF to storage: {e}")
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


def extract_text_via_ocr(pdf_bytes: bytes) -> str | None:
    """Fallback for scanned/image-only PDFs — rasterizes the first few
    pages and runs OCR. Confirmed necessary: several NICO filings (trading
    statements, dividend notices) are genuinely scanned documents with no
    text layer at all, not a pdfplumber parsing gap.

    Requires system tesseract-ocr installed alongside the pytesseract
    Python package (`pip install pytesseract pillow`):
      Windows: https://github.com/UB-Mannheim/tesseract/wiki
      Mac:     brew install tesseract
      Linux:   apt install tesseract-ocr
    If tesseract isn't installed, this fails gracefully — caller falls
    back to "no extractable text", same as before OCR was added.
    """
    if not OCR_AVAILABLE:
        return None

    try:
        import pdfplumber as _pp  # rendering via pdfplumber's underlying pdfium page

        with _pp.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages[:MAX_OCR_PAGES]:
                pil_image = page.to_image(resolution=150).original
                ocr_text = pytesseract.image_to_string(pil_image)
                if ocr_text.strip():
                    pages_text.append(ocr_text)
            return "\n".join(pages_text) if pages_text else None
    except Exception as e:
        print(f"  FAIL OCR: {e}")
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

    # Process rows missing EITHER details or a stored PDF — a row can
    # already have details from a prior run but not yet have a PDF
    # uploaded if you ran this before the storage migration existed.
    query = (
        supabase.table("corporate_actions")
        .select("id, type, headline, source_url, slug, details, pdf_storage_path")
        .not_.is_("source_url", "null")
    )
    if limit:
        query = query.limit(limit)

    all_rows = query.execute().data
    rows = [r for r in all_rows if r["details"] is None or r["pdf_storage_path"] is None]
    print(f"Found {len(rows)} rows needing details and/or a stored PDF.\n")

    updated = 0
    failed = 0

    for row in rows:
        print(f"[{row['id']}] {row['type']} — {row['headline']} ({row['source_url']})")

        slug = row["slug"] or slugify(row["headline"], row["id"])

        pdf_bytes = fetch_pdf_bytes(row["source_url"])
        if pdf_bytes is None:
            failed += 1
            time.sleep(delay)
            continue

        update_fields = {"slug": slug}

        # Upload PDF regardless of whether text extraction succeeds below —
        # a download link is useful even for scanned/image-only filings.
        if row["pdf_storage_path"] is None and not dry_run:
            storage_path = upload_pdf(supabase, pdf_bytes, slug)
            if storage_path:
                update_fields["pdf_storage_path"] = storage_path
        elif row["pdf_storage_path"] is None and dry_run:
            print(f"  (dry-run) would upload PDF as {slug}.pdf")

        text = extract_text(pdf_bytes)
        used_ocr = False
        if not text:
            if OCR_AVAILABLE:
                print("  no text layer — trying OCR (slower)...")
                text = extract_text_via_ocr(pdf_bytes)
                used_ocr = text is not None
            if not text:
                reason = "OCR found nothing either" if OCR_AVAILABLE else "OCR not installed"
                print(f"  no extractable text ({reason}) — PDF still stored")

        if text:
            details = build_details(row["type"], text)
            if used_ocr:
                details = f"[OCR — verify against PDF]\n{details}"
            print(f"  -> {details[:120]}...")

            # Diagnostic: if this is a Dividend row and the summary line
            # found an amount but no dates, print the raw text so the
            # regex can be tuned against what OCR/extraction ACTUALLY
            # produced rather than assumed clean source text — OCR often
            # introduces spacing/character noise that breaks date matching
            # even when the same wording works fine against clean text.
            if dry_run and row["type"] == "Dividend" and "Ex-dividend" not in details and "Payment date" not in details:
                print("  [DIAGNOSTIC] no dates matched — raw extracted text follows:")
                print("  " + "-" * 56)
                for line in text.splitlines():
                    print(f"  {line}")
                print("  " + "-" * 56)

            if row["details"] is None:
                update_fields["details"] = details

        if not dry_run:
            supabase.table("corporate_actions").update(update_fields).eq(
                "id", row["id"]
            ).execute()

        updated += 1
        time.sleep(delay)

    print()
    print("=" * 60)
    print(f"Processed: {updated}")
    print(f"Failed (download error): {failed}")
    if dry_run:
        print("(--dry-run set — no rows were actually written, no PDFs uploaded)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract PDF content + store PDF for corporate_actions")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N rows")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between PDF downloads")
    parser.add_argument("--dry-run", action="store_true", help="Print what would happen without writing")
    args = parser.parse_args()

    process(limit=args.limit, dry_run=args.dry_run, delay=args.delay)