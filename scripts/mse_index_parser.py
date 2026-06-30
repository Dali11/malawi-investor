# scripts/mse_index_parser.py
# Shared parsing logic for the MSE benchmark-index trading summary
# published on afx.kwayisi.org/mse/. Used by both the live daily
# scraper (scrape_mse.py) and the historical backfill script
# (backfill_mse_indices.py) so the two never drift out of sync.

import re
from datetime import date, datetime

INDEX_NAMES = {
    "MASI": "Malawi All Share Index",
    "MDSI": "Malawi Domestic Share Index",
    "MFSI": "Malawi Foreign Share Index",
}

CAP_RE = re.compile(
    r"current market capitalization of the Malawi Stock Exchange is MWK\s*([\d,]+\.?\d*)\s*(trillion|billion|million)",
    re.IGNORECASE,
)

# "MSE TRADING SUMMARY FOR MONDAY, JUNE 8, 2026" — the page always
# states which trading day the summary covers. Parsing this directly
# is far more reliable than stamping rows with date.today(), since
# that breaks the moment the scraper runs late, retries, or the
# source page is stale (and is meaningless for backfilled snapshots).
TRADING_DATE_RE = re.compile(
    r"MSE TRADING SUMMARY FOR \w+,\s+([A-Za-z]+ \d{1,2},?\s*\d{4})",
    re.IGNORECASE,
)


def _cap_to_mwk(amount: str, unit: str) -> float:
    multiplier = {"trillion": 1e12, "billion": 1e9, "million": 1e6}[unit.lower()]
    return float(amount.replace(",", "")) * multiplier


def _signed_pct(direction: str, magnitude: str) -> float:
    value = float(magnitude)
    return -value if direction == "loss" else value


def parse_trading_date(text: str) -> str | None:
    """Extracts the trading day the summary covers, as an ISO date
    string. Returns None if the page text doesn't contain the
    expected "MSE TRADING SUMMARY FOR ..." sentence (e.g. a very old
    archived snapshot with a different page layout).
    """
    m = TRADING_DATE_RE.search(text)
    if not m:
        return None
    raw = re.sub(r"\s+", " ", m.group(1)).strip()
    try:
        return datetime.strptime(raw, "%B %d, %Y").date().isoformat()
    except ValueError:
        return None


def parse_index_rows(text: str, index_date: str) -> list[dict]:
    """Parses MASI/MDSI/MFSI rows out of the page's plain-text trading
    summary. `index_date` is supplied by the caller (today, or a
    parsed historical date during backfill) rather than computed here,
    so this function has no notion of "now".
    """
    market_cap = None
    cap_match = CAP_RE.search(text)
    if cap_match:
        market_cap = _cap_to_mwk(cap_match.group(1), cap_match.group(2))

    rows = []

    masi_block_match = re.search(
        r"Malawi All Share Index \(MASI\)(.*?year-to-date (?:loss|gain) of [\d.]+%)",
        text,
    )
    if masi_block_match:
        block = masi_block_match.group(1)
        close_match = re.search(r"close at ([\d,]+\.\d+)", block)
        day_match = re.search(r"([\d,]+\.\d+)\s*\(([+-]?[\d.]+)%\)\s*points", block)
        week_match = re.search(r"1-week (loss|gain) of ([\d.]+)%", block)
        ytd_match = re.search(r"year-to-date (loss|gain) of ([\d.]+)%", block)

        if close_match:
            rows.append({
                "index_code": "MASI",
                "value": float(close_match.group(1).replace(",", "")),
                "day_change_pct": float(day_match.group(2)) if day_match else None,
                "week_change_pct": _signed_pct(*week_match.groups()) if week_match else None,
                "ytd_change_pct": _signed_pct(*ytd_match.groups()) if ytd_match else None,
                "market_cap": market_cap,
                "index_date": index_date,
            })

    for code, full_name in (("MDSI", "Malawi Domestic Share Index"), ("MFSI", "Malawi Foreign Share Index")):
        m = re.search(
            re.escape(full_name) + r"\s*\(([+-]?[\d.]+)%;\s*([+-]?[\d.]+)%\s*1WK;\s*([+-]?[\d.]+)%\s*YTD\)",
            text,
        )
        if not m:
            continue
        rows.append({
            "index_code": code,
            "value": None,
            "day_change_pct": float(m.group(1)),
            "week_change_pct": float(m.group(2)),
            "ytd_change_pct": float(m.group(3)),
            "market_cap": None,
            "index_date": index_date,
        })

    return rows
