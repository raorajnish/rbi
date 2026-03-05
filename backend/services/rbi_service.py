import os
import sys
import json
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

# Add parent directory to path to import the scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq import AsyncGroq
from bs4 import BeautifulSoup

from rbi_notifications_crawler import fetch_notifications
from notification_filter_agent import filter_notifications
from notification_detail_extractor import fetch_page, parse_notification_page

async def generate_groq_insights(full_text: str, category: str, title: str) -> dict:
    """Uses Groq to generate structured insights from the raw RBI notification text"""
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return {"summary": "Groq API key missing.", "key_changes": [], "impact_on_organization": "Unknown", "risk_if_ignored": [], "recommended_actions": [], "impact_level": "Medium", "deadline": "None"}
    
    client = AsyncGroq(api_key=api_key)
    
    prompt = f"""
    You are a senior RBI compliance advisor AI.
    Your job is to analyze an RBI regulatory notification and generate insights for a financial institution.

    Organization type:
    {category}

    Notification title:
    {title}

    Notification content:
    {full_text[:4000]}

    Your task:
    1. Summarize the regulation in simple terms.
    2. Identify what changes or requirements are introduced.
    3. Explain how it affects this organization type.
    4. Identify risks if the organization does not comply.
    5. Generate a list of actionable steps the organization should take.
    6. Determine the Impact level (High / Medium / Low).
    7. Deadline (if any stated in the text, otherwise "None").

    Return the result strictly in the following structured JSON format:

    {{
      "summary": "short summary of the regulation",
      "impact_level": "High/Medium/Low",
      "key_changes": ["change 1", "change 2"],
      "impact_on_organization": "explain how this affects the company",
      "risk_if_ignored": ["risk 1", "risk 2"],
      "recommended_actions": ["action 1", "action 2"],
      "deadline": "YYYY-MM-DD or None"
    }}
    """
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error generating Groq insights: {e}")
        return {
            "summary": "Failed to generate AI insights due to an error.",
            "impact_level": "Medium",
            "key_changes": [],
            "impact_on_organization": "Unknown",
            "risk_if_ignored": [],
            "recommended_actions": ["Review the official document manually."],
            "deadline": "None"
        }

async def process_new_notifications_for_user(user: dict, db: AsyncIOMotorDatabase):
    category = user.get("organization_type", "Unknown")
    
    print("Fetching new notifications from RBI...")
    # 1. Fetch metadata (we do top 15 so we don't crawl the whole site)
    all_notifs = fetch_notifications()[:15]
    
    # Existing URLs to prevent duplicates
    existing_urls = [n.get("source_url") for n in user.get("notifications", [])]
    
    # 2. Filter by category
    matched_notifs = filter_notifications(all_notifs, category)
    
    new_notifs_added = 0
    updated_notifications = user.get("notifications", [])
    
    # 3. Process new matches (limit to 3 per scrape payload so it's fast during the MVP presentation)
    for item in matched_notifs[:3]:
        url = item.get("url")
        if not url or url in existing_urls:
            continue
            
        print(f"Extracting full details for {url}")
        soup = fetch_page(url)
        if not soup:
            continue
            
        parsed = parse_notification_page(soup, url, item.get("title", ""), item.get("id", 0))
        if not parsed or not parsed.get("full_notification_text"):
            continue
            
        print("Generating AI insights via Groq...")
        insights = await generate_groq_insights(parsed["full_notification_text"], category, parsed.get("title", ""))
        
        enriched_notif = {
            "title": parsed.get("title", "Unknown Title"),
            "date": parsed.get("date", "Unknown Date"),
            "reference_number": parsed.get("reference_number", ""),
            "department": parsed.get("department_reference", ""),
            "source_url": url,
            "ai_summary": insights.get("summary", "No summary available."),
            "ai_impact_level": insights.get("impact_level", "Medium"),
            "ai_key_changes": insights.get("key_changes", []),
            "ai_impact_on_organization": insights.get("impact_on_organization", "Unknown impact."),
            "ai_risk": insights.get("risk_if_ignored", []),
            "ai_action_items": insights.get("recommended_actions", []),
            "ai_deadline": insights.get("deadline", "None"),
            "scraped_at": datetime.now().isoformat()
        }
        
        updated_notifications.insert(0, enriched_notif)
        new_notifs_added += 1
        
        await asyncio.sleep(0.5)
        
    if new_notifs_added > 0:
        await db.users.update_one(
            {"username": user["username"]},
            {
                "$set": {
                    "notifications": updated_notifications,
                    "latest_scraped_date": datetime.now().strftime("%Y-%m-%d")
                }
            }
        )
        print(f"Added {new_notifs_added} enriched notifications to {user['username']}")
    
    return updated_notifications
