import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

BASE_URL = "https://www.rbi.org.in"
URL = "https://www.rbi.org.in/scripts/NotificationUser.aspx"

SAVE_PATH = r"C:\Users\vedant\OneDrive\Desktop\RBI_pilot\data\metadata\rbi_notifications.json"

session = requests.Session()

headers = {
    "User-Agent": "Mozilla/5.0"
}


def fetch_notifications():

    # STEP 1 — Initial request to get VIEWSTATE
    response = session.get(URL, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    viewstate = soup.find("input", {"id": "__VIEWSTATE"})["value"]
    eventvalidation = soup.find("input", {"id": "__EVENTVALIDATION"})["value"]
    viewstategen = soup.find("input", {"id": "__VIEWSTATEGENERATOR"})["value"]

    # STEP 2 — POST request to load notification data
    payload = {
        "__VIEWSTATE": viewstate,
        "__VIEWSTATEGENERATOR": viewstategen,
        "__EVENTVALIDATION": eventvalidation,
        "hdnYear": "",
        "hdnMonth": "0"
    }

    response = session.post(URL, headers=headers, data=payload)

    soup = BeautifulSoup(response.text, "html.parser")

    table = soup.find("table")

    notifications = []

    if not table:
        print("Notification table not found")
        return []

    rows = table.find_all("tr")

    for row in rows:

        cols = row.find_all("td")

        if len(cols) < 2:
            continue

        title_cell = cols[0]
        size_cell = cols[1]

        title = title_cell.text.strip()
        size = size_cell.text.strip()

        link = title_cell.find("a")

        if link:

            href = link.get("href")

            # fix malformed URL
            if href.startswith("/"):
                url = BASE_URL + href
            else:
                url = BASE_URL + "/scripts/" + href

            # extract notification id
            notification_id = None
            if "Id=" in href:
                try:
                    notification_id = int(href.split("Id=")[1].split("&")[0])
                except:
                    pass

            notifications.append({
                "id": notification_id,
                "title": title,
                "size": size,
                "url": url,
                "scraped_at": datetime.now().strftime("%Y-%m-%d")
            })

    return notifications


def save_json(data):

    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump({"notifications": data}, f, indent=4, ensure_ascii=False)


if __name__ == "__main__":

    notifications = fetch_notifications()

    save_json(notifications)

    print("Saved", len(notifications), "notifications")