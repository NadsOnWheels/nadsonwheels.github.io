
import re
import time
import urllib.parse
import urllib.robotparser

import requests
from bs4 import BeautifulSoup

ROOT = "https://www.landestate.co.uk"
SEARCH = ROOT + "/properties/?availability=9&department=residential-lettings"
UA = "NadsRentalExplorer/1.0 (public listing diagnostic)"

session = requests.Session()
session.headers.update({"User-Agent": UA})

robots = urllib.robotparser.RobotFileParser()
robots.set_url(ROOT + "/robots.txt")
robots.read()

def fetch(url):
    if not url.startswith(ROOT + "/"):
        raise ValueError("Unexpected website")
    if not robots.can_fetch(UA, url):
        raise ValueError("Disallowed by robots.txt")
    response = session.get(url, timeout=20)
    response.raise_for_status()
    time.sleep(1)
    return BeautifulSoup(response.text, "html.parser")

print("=== NADS RENTAL DIAGNOSTIC ===", flush=True)

soup = fetch(SEARCH)

links = sorted({
    urllib.parse.urljoin(ROOT, a["href"])
    for a in soup.find_all("a", href=True)
    if "/property-to-rent/" in a["href"]
})

print("Unique property links:", len(links), flush=True)

pagination = sorted({
    urllib.parse.urljoin(ROOT, a["href"])
    for a in soup.find_all("a", href=True)
    if "page/" in a["href"] or "paged=" in a["href"]
})

print("Pagination links:", pagination[:10], flush=True)

for url in links[:5]:
    print("\nPROPERTY:", url, flush=True)
    try:
        page = fetch(url)
        heading = page.find("h1")
        title = heading.get_text(" ", strip=True) if heading else "NO HEADING"

        text = page.get_text(" ", strip=True)
        price = re.search(
            r"£[\d,]+\s*(?:pcm|pw|per month)",
            text, re.I
        )

        statuses = sorted(set(re.findall(
            r"\b(?:To Let|Let Agreed|Let By|Available Now)\b",
            text, re.I
        )))

        print("Title:", title, flush=True)
        print("Price:", price.group(0) if price else "Not found", flush=True)
        print("Status phrases:", statuses, flush=True)
        print("Page title:", page.title.get_text(" ", strip=True) if page.title else "None", flush=True)

    except Exception as error:
        print("ERROR:", repr(error), flush=True)

print("\n=== DIAGNOSTIC COMPLETE ===", flush=True)
