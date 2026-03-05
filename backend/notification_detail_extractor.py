"""
notification_detail_extractor.py
----------------------------------
Pipeline stage 2 for RBI_pilot.

Reads filtered notifications JSON (from notification_filter_agent.py),
visits each RBI notification URL, scrapes the FULL official letter,
and extracts every structural field into clean JSON.

Output fields per notification:
  id, title, reference_number, department_reference, date,
  recipients, subject, full_notification_text, signature,
  pdf_links, source_url

Project Root: C:\\Users\\vedant\\OneDrive\\Desktop\\RBI_pilot
"""

import os
import re
import sys
import json
import time

from pathlib import Path
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Absolute project paths
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(r"C:\Users\vedant\OneDrive\Desktop\RBI_pilot")
FILTERED_DIR = PROJECT_ROOT / "data" / "filtered"
DETAILED_DIR = PROJECT_ROOT / "data" / "detailed"

# ---------------------------------------------------------------------------
# HTTP session
# ---------------------------------------------------------------------------

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
})

REQUEST_TIMEOUT  = 15
RATE_LIMIT_DELAY = 1.0

# ---------------------------------------------------------------------------
# Regex patterns for field extraction
# ---------------------------------------------------------------------------

# RBI circular number, e.g. "RBI/2025-26/225" or "RBI/DoR/2025-26/224"
RE_RBI_REF = re.compile(
    r"RBI(?:/[A-Za-z]+)?/\d{4}-\d{2,4}/\d+"
)

# Department reference, e.g. "DOR.AML.REC.415/14.06.001/2025-26"
# Also handles DOS, DBS, DCBR, CO, etc.
RE_DEPT_REF = re.compile(
    r"(?:DOR|DOS|DBS|DCBR|DNBR|CO|DPSS|FMRD|DGGBA|CGST|IDMD)"
    r"[\w.]+/[\w./-]+"
)

# Date line, e.g. "March 02, 2026"
RE_DATE = re.compile(
    r"\b(?:January|February|March|April|May|June|July|August"
    r"|September|October|November|December)"
    r"\s+\d{1,2},\s+\d{4}\b"
)

# Salutation marker that separates headers from body
RE_SALUTATION = re.compile(
    r"^(Madam\s*/\s*Dear\s+Sir|Dear\s+Sir\s*/\s*Madam"
    r"|Dear\s+Sir|Madam|To\s+Whom\s+It\s+May\s+Concern)",
    re.IGNORECASE | re.MULTILINE,
)

# Closing / signature block
RE_CLOSING = re.compile(
    r"Yours\s+(?:faithfully|sincerely|truly)",
    re.IGNORECASE,
)

# Signature name in parentheses followed by title on the next line
RE_SIGNATURE = re.compile(
    r"\(([^)]+)\)\s*\n\s*([^\n]+(?:General\s+Manager|Director|"
    r"Executive\s+Director|Governor|Deputy\s+Governor|Secretary)[^\n]*)",
    re.IGNORECASE,
)

# -----------------------------------------------------------------------
# 1. Load filtered notifications
# -----------------------------------------------------------------------

def load_filtered_notifications(category: str) -> dict:
    safe = category.lower().replace(" ", "_")
    path = FILTERED_DIR / f"{safe}_notifications.json"

    if not path.exists():
        print(f"[ERROR] Filtered file not found: {path}")
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        print(f"[INFO] Loaded {len(data.get('notifications', []))} "
              f"notifications from {path}")
        return data
    except json.JSONDecodeError as exc:
        print(f"[ERROR] Bad JSON in {path}: {exc}")
        return {}


# -----------------------------------------------------------------------
# 2. Fetch a page
# -----------------------------------------------------------------------

def fetch_page(url: str) -> BeautifulSoup | None:
    try:
        resp = SESSION.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return BeautifulSoup(resp.content, "html.parser")
    except requests.exceptions.HTTPError as e:
        print(f"  [WARN] HTTP error: {e}")
    except requests.exceptions.ConnectionError:
        print(f"  [WARN] Connection failed: {url}")
    except requests.exceptions.Timeout:
        print(f"  [WARN] Timeout: {url}")
    except Exception as e:
        print(f"  [WARN] Unexpected error: {e}")
    return None


# -----------------------------------------------------------------------
# 3. Extract ordered raw text from the RBI content container
# -----------------------------------------------------------------------

def extract_raw_lines(soup: BeautifulSoup) -> list[str]:
    """
    Locate the main notification content container on an RBI page and
    return ALL visible text lines, in document order, preserving structure.

    RBI pages typically render the letter inside one of:
      - <div id="maincontent"> (older pages)
      - <td class="tabletext"> (tabular layout)
      - Any <table> whose text begins with 'RBI/'
    We try selectors in priority order and fall back to full body scan.
    """
    container = None

    # Priority 1 — id-based
    for cid in ("maincontent", "content", "mainContent"):
        container = soup.find(id=cid)
        if container and len(container.get_text(strip=True)) > 100:
            break

    # Priority 2 — class-based
    if not container:
        for cls in ("tabletext", "ms-rtestate-field", "notification"):
            container = soup.find(class_=cls)
            if container and len(container.get_text(strip=True)) > 100:
                break

    # Priority 3 — find the <table> cell that starts with "RBI/"
    if not container:
        for td in soup.find_all("td"):
            txt = td.get_text(strip=True)
            if txt.startswith("RBI/") and len(txt) > 200:
                container = td
                break

    # Fallback — scan entire body
    if not container:
        container = soup.find("body") or soup

    # Walk every inline/block element in document order and collect text
    lines: list[str] = []
    for elem in container.descendants:
        if elem.name in ("p", "td", "li", "div", "span", "h1", "h2",
                         "h3", "h4", "b", "strong", "br"):
            txt = elem.get_text(separator=" ", strip=True)
            if txt:
                lines.append(txt)

    # Deduplicate consecutive identical lines (table cells can repeat)
    deduped: list[str] = []
    for line in lines:
        if not deduped or line != deduped[-1]:
            deduped.append(line)

    return deduped


def lines_to_text(lines: list[str]) -> str:
    """Join lines with double-newline separators."""
    return "\n\n".join(lines)


# -----------------------------------------------------------------------
# 4. Extract the page title from <title> or <h2>/<h3> tags
#    (avoids the bug where a date year "2026" was picked up as title)
# -----------------------------------------------------------------------

def extract_title(soup: BeautifulSoup, fallback: str) -> str:
    """
    Extracts the true notification title.
    Strategy:
      1. <title> tag — strip boilerplate like ':: Reserve Bank of India'
      2. First <h2> or <h3> with > 20 chars that is NOT just a year/number
      3. Fallback to the title from the metadata JSON
    """
    # 1. <title> tag
    title_tag = soup.find("title")
    if title_tag:
        raw = title_tag.get_text(separator=" ", strip=True)
        # Strip " :: Reserve Bank of India" suffixes, encoding artefacts
        raw = re.sub(r"\s*::\s*Reserve Bank of India.*", "", raw, flags=re.I)
        raw = raw.strip()
        if len(raw) > 15:
            return raw

    # 2. Heading tags in order
    for tag_name in ("h2", "h3", "h1", "h4"):
        for tag in soup.find_all(tag_name):
            txt = tag.get_text(strip=True)
            # Reject bare years, short strings, or numeric-only tokens
            if len(txt) > 20 and not re.fullmatch(r"[\d\s]+", txt):
                return txt

    return fallback


# -----------------------------------------------------------------------
# 5. Structured field extraction from the raw text block
# -----------------------------------------------------------------------

def extract_fields(raw_text: str, title: str, source_url: str) -> dict:
    """
    Parse the full raw notification text and return a structured dict with:
      reference_number, department_reference, date, recipients,
      subject, full_notification_text, signature
    """

    # ---- reference_number ----
    rbi_match = RE_RBI_REF.search(raw_text)
    reference_number = rbi_match.group().strip() if rbi_match else ""

    # ---- department_reference ----
    dept_match = RE_DEPT_REF.search(raw_text)
    department_reference = dept_match.group().strip() if dept_match else ""

    # ---- date ----
    date_match = RE_DATE.search(raw_text)
    date = date_match.group().strip() if date_match else ""

    # ---- split on salutation to separate header block from body ----
    sal_match = RE_SALUTATION.search(raw_text)

    if sal_match:
        header_block = raw_text[: sal_match.start()]
        body_block   = raw_text[sal_match.start():]   # includes salutation
    else:
        # No salutation found — treat everything as body
        header_block = ""
        body_block   = raw_text

    # ---- recipients ----
    # Everything between the date line and the salutation
    recipients = ""
    if sal_match and date:
        date_pos = header_block.find(date)
        if date_pos != -1:
            after_date = header_block[date_pos + len(date):]
            recipients = after_date.strip()
            # Clean up — remove leading punctuation / blank lines
            recipients = re.sub(r"^\s*[\n\r]+", "", recipients).strip()

    # ---- subject ----
    # The subject line appears immediately after the salutation line.
    # It runs until the first numbered paragraph or paragraph marker.
    subject = ""
    if sal_match:
        # Skip the salutation line itself
        after_sal = body_block[len(sal_match.group()):].strip()
        # Subject ends at the first blank-line-then-digit pattern or "Please"
        subj_end = re.search(
            r"\n\n(?:\d+\.|Please\b|In\s+this\b|We\s+wish|The\s+Reserve\b)",
            after_sal,
            re.IGNORECASE,
        )
        if subj_end:
            subject = after_sal[: subj_end.start()].strip()
        else:
            # Take first two lines as subject
            subject = "\n".join(after_sal.splitlines()[:2]).strip()

    # ---- signature ----
    signature = ""
    closing_match = RE_CLOSING.search(body_block)
    if closing_match:
        after_closing = body_block[closing_match.end():].strip()
        # Try pattern: (Name)\nTitle
        sig_match = RE_SIGNATURE.search(after_closing)
        if sig_match:
            signature = f"({sig_match.group(1).strip()})\n{sig_match.group(2).strip()}"
        else:
            # Fallback: take up to 3 lines after closing
            sig_lines = [l.strip() for l in after_closing.splitlines() if l.strip()]
            signature = "\n".join(sig_lines[:3])

    # ---- full_notification_text ----
    # Everything from the salutation to (but not including) "Yours faithfully"
    if closing_match:
        full_text = body_block[: closing_match.start()].strip()
    else:
        full_text = body_block.strip()

    return {
        "title":                  title,
        "reference_number":       reference_number,
        "department_reference":   department_reference,
        "date":                   date,
        "recipients":             recipients,
        "subject":                subject,
        "full_notification_text": full_text,
        "signature":              signature,
        "source_url":             source_url,
    }


# -----------------------------------------------------------------------
# 6. Extract PDF links
# -----------------------------------------------------------------------

def extract_pdf_links(soup: BeautifulSoup,
                      base: str = "https://www.rbi.org.in") -> list[str]:
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.lower().endswith(".pdf"):
            if href.startswith("http"):
                links.append(href)
            else:
                links.append(base + ("" if href.startswith("/") else "/") + href)
    return list(dict.fromkeys(links))  # deduplicate, preserve order


# -----------------------------------------------------------------------
# 7. Validate entry
# -----------------------------------------------------------------------

def is_valid(entry: dict) -> bool:
    return bool(
        entry.get("title")
        and entry.get("full_notification_text")
        and entry.get("source_url")
    )


# -----------------------------------------------------------------------
# 8. Save detailed dataset
# -----------------------------------------------------------------------

def save_detailed(category: str, notifications: list[dict]) -> Path:
    DETAILED_DIR.mkdir(parents=True, exist_ok=True)
    safe = category.lower().replace(" ", "_")
    out  = DETAILED_DIR / f"{safe}_notification_details.json"
    payload = {
        "category":      category,
        "extracted_at":  datetime.now().isoformat(timespec="seconds"),
        "total":         len(notifications),
        "notifications": notifications,
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=4, ensure_ascii=False)
    return out


# -----------------------------------------------------------------------
# 9. Parse a single notification page end-to-end
# -----------------------------------------------------------------------

def parse_notification_page(soup: BeautifulSoup,
                             source_url: str,
                             fallback_title: str,
                             item_id: int) -> dict | None:
    try:
        # Step A — ordered raw lines from container
        lines    = extract_raw_lines(soup)
        raw_text = lines_to_text(lines)

        # Step B — true title
        title = extract_title(soup, fallback_title)

        # Step C — structured field extraction
        entry = extract_fields(raw_text, title, source_url)

        # Step D — PDF links
        entry["pdf_links"] = extract_pdf_links(soup)

        # Step E — carry original id
        entry["id"] = item_id

        return entry

    except Exception as exc:
        print(f"  [ERROR] Parsing failed: {exc}")
        return None


# -----------------------------------------------------------------------
# 10. Main pipeline
# -----------------------------------------------------------------------

def main() -> None:
    print("\n" + "=" * 60)
    print("  RBI Notification Detail Extractor")
    print("=" * 60)

    print("\nEnter the category name (e.g. NBFC, Commercial Bank):")
    try:
        category = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n[INFO] Exiting.")
        sys.exit(0)

    if not category:
        print("[ERROR] Category cannot be empty.")
        sys.exit(1)

    # Load filtered metadata
    print("\nLoading filtered notifications...")
    data  = load_filtered_notifications(category)
    items = data.get("notifications", [])

    if not items:
        print("[ERROR] No notifications found. Exiting.")
        sys.exit(1)

    total = len(items)
    print(f"\nTotal URLs found: {total}\n")

    detailed: list[dict] = []

    for idx, item in enumerate(items, start=1):
        url    = item.get("url", "").strip()
        f_ttl  = item.get("title", "")
        iid    = item.get("id", "N/A")

        print(f"Fetching notification {idx}/{total}  [id={iid}]")
        print(f"  URL: {url}")

        if not url:
            print("  [SKIP] No URL in metadata.\n")
            continue

        soup = fetch_page(url)
        if soup is None:
            print("  [SKIP] Could not fetch page.\n")
            time.sleep(RATE_LIMIT_DELAY)
            continue

        entry = parse_notification_page(soup, url, f_ttl, iid)

        if entry is None or not is_valid(entry):
            print("  [SKIP] Missing required fields.\n")
        else:
            print(f"  Extracted reference number : {entry.get('reference_number','—')}")
            print(f"  Extracted dept reference   : {entry.get('department_reference','—')}")
            print(f"  Extracted date             : {entry.get('date','—')}")
            print(f"  Extracted subject          : {entry.get('subject','—')[:80]}")
            print(f"  Extracted signature        : {entry.get('signature','—')[:60]}")
            print(f"  Full text length           : {len(entry.get('full_notification_text',''))} chars")
            print("  Saved entry successfully.\n")
            detailed.append(entry)

        time.sleep(RATE_LIMIT_DELAY)

    if not detailed:
        print("[WARN] No valid entries extracted. Output file not written.")
        sys.exit(0)

    out = save_detailed(category, detailed)
    print("=" * 60)
    print(f"Saved detailed dataset to:\n{out}")
    print(f"\nTotal valid entries: {len(detailed)} / {total}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
