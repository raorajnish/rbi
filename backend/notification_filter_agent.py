"""
notification_filter_agent.py
-----------------------------
Reads RBI notification metadata, classifies a company using the Groq API,
filters relevant notifications, and saves results to a JSON file.

Project Root: C:\\Users\\vedant\\OneDrive\\Desktop\\RBI_pilot
"""

import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# ---------------------------------------------------------------------------
# Paths — all absolute, anchored to the project root
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(r"C:\Users\vedant\OneDrive\Desktop\RBI_pilot")

METADATA_FILE = PROJECT_ROOT / "data" / "metadata" / "rbi_notifications.json"
FILTERED_DIR  = PROJECT_ROOT / "data" / "filtered"

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv()  # loads .env from the current working directory if present

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# ---------------------------------------------------------------------------
# Supported regulatory categories (used as a hint in the system prompt)
# ---------------------------------------------------------------------------

CATEGORIES = [
    "NBFC",
    "Commercial Bank",
    "Small Finance Bank",
    "Payment Bank",
    "MSME lender",
    "Forex dealer",
    "Cooperative Bank",
]

# ---------------------------------------------------------------------------
# 1. Load notifications
# ---------------------------------------------------------------------------

def load_notifications(path: Path) -> list[dict]:
    """
    Load the RBI notifications list from a JSON file.
    Returns an empty list and prints a warning on any failure.
    """
    if not path.exists():
        print(f"[ERROR] Notifications file not found: {path}")
        return []

    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        notifications = data.get("notifications", [])
        print(f"[INFO] Loaded {len(notifications)} notifications from {path}")
        return notifications
    except json.JSONDecodeError as exc:
        print(f"[ERROR] Invalid JSON in {path}: {exc}")
        return []


# ---------------------------------------------------------------------------
# 2. Classify company via Groq
# ---------------------------------------------------------------------------

def classify_company(user_prompt: str) -> str | None:
    """
    Send the user prompt to Groq and extract the regulatory company category.
    Returns the category string or None if classification fails.
    """
    if not GROQ_API_KEY:
        print("[ERROR] GROQ_API_KEY is not set. Export it as an environment variable.")
        return None

    system_message = (
        "You are a regulatory classification assistant for the Reserve Bank of India. "
        "Extract the single regulatory company category from the user's description. "
        "Respond with ONLY one of the following categories — no explanation, no extra text:\n"
        + ", ".join(CATEGORIES)
    )

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0,
            max_tokens=20,
        )
        category = response.choices[0].message.content.strip()
        return category
    except Exception as exc:
        print(f"[ERROR] Groq API call failed: {exc}")
        return None


# ---------------------------------------------------------------------------
# 3. Filter notifications by category keyword
# ---------------------------------------------------------------------------

def filter_notifications(notifications: list[dict], category: str) -> list[dict]:
    """
    Return notifications whose title contains the category keyword
    (case-insensitive). Also matches common short-forms:
        NBFC          → non-banking financial
        Cooperative Bank → co-operative / cooperative
    """
    keywords = _build_keywords(category)
    matched = [
        n for n in notifications
        if any(kw in n.get("title", "").lower() for kw in keywords)
    ]
    return matched


def _build_keywords(category: str) -> list[str]:
    """Map a category to one or more lowercase search terms."""
    cat_lower = category.lower().strip()

    keyword_map: dict[str, list[str]] = {
        "nbfc":                ["non-banking financial", "nbfc"],
        "commercial bank":     ["commercial bank"],
        "small finance bank":  ["small finance bank"],
        "payment bank":        ["payment bank"],
        "msme lender":         ["msme", "micro, small", "micro small"],
        "forex dealer":        ["forex", "foreign exchange management"],
        "cooperative bank":    ["cooperative bank", "co-operative bank",
                                "rural co-operative"],
    }

    for key, terms in keyword_map.items():
        if key in cat_lower or cat_lower in key:
            return terms

    # Fallback: use the category as-is
    return [cat_lower]


# ---------------------------------------------------------------------------
# 4. Save filtered results
# ---------------------------------------------------------------------------

def save_filtered(category: str, notifications: list[dict]) -> Path:
    """
    Write the filtered notifications to data/filtered/<category>_notifications.json.
    Ensures the output directory exists. Returns the output file path.
    """
    FILTERED_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = category.lower().replace(" ", "_")
    output_path = FILTERED_DIR / f"{safe_name}_notifications.json"

    payload = {
        "category":      category,
        "notifications": notifications,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=4, ensure_ascii=False)

    return output_path


# ---------------------------------------------------------------------------
# 5. Main execution flow
# ---------------------------------------------------------------------------

def main() -> None:
    print("\n" + "=" * 55)
    print("  RBI Notification Filter Agent")
    print("=" * 55)

    # --- Get user input ---
    print("\nDescribe the company:")
    try:
        user_prompt = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n[INFO] No input received. Exiting.")
        sys.exit(0)

    if not user_prompt:
        print("[ERROR] Empty input. Please describe the company.")
        sys.exit(1)

    # --- Classify via Groq ---
    print("\nContacting Groq for classification…")
    category = classify_company(user_prompt)

    if not category:
        print("[ERROR] Could not determine company category. Exiting.")
        sys.exit(1)

    print(f"\nDetected category:\n{category}")

    # --- Load notifications ---
    notifications = load_notifications(METADATA_FILE)
    if not notifications:
        print("[ERROR] No notifications to filter. Exiting.")
        sys.exit(1)

    # --- Filter ---
    matched = filter_notifications(notifications, category)

    # --- Save ---
    if matched:
        output_path = save_filtered(category, matched)
        print(f"\nFiltered notifications saved to:\n{output_path}")
    else:
        print("\n[INFO] No notifications matched the detected category.")

    print(f"\nTotal matches:\n{len(matched)}")
    print("=" * 55 + "\n")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()
