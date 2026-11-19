
"""Refresh publicly advertised Land Estates rental listings."""

import datetime
import json
import time
import urllib.parse
import urllib.robotparser
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = "https://www.landestate.co.uk"
SEARCH = ROOT + "/properties/?availability=9&department=residential-lettings"
UA = "NadsRentalExplorer/1.0 (public rental listings)"
OUTPUT = Path("rentals.json")

session = requests.Session()
session.headers.update({"User-Agent": UA})

robots = urllib.robotparser.RobotFileParser()
robots.set_url(ROOT + "/robots.txt")
robots.read()


def fetch(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "www.landestate.co.uk":
        raise ValueError("Unexpected website: " + url)
    if not robots.can_fetch(UA, url):
        raise ValueError("Blocked by robots.txt: " + url)

    response = session.get(url, timeout=20)
    response.raise_for_status()
    time.sleep(1)
    return BeautifulSoup(response.text, "html.parser")


def clean_url(url):
    return urllib.parse.urljoin(ROOT, url).split("?")[0].split("#")[0]


print("Fetching current To Let search results...", flush=True)
search_page = fetch(SEARCH)

links = sorted({
    clean_url(a["href"])
    for a in search_page.find_all("a", href=True)
    if "/property-to-rent/" in a["href"]
    and urllib.parse.urlparse(clean_url(a["href"])).netloc
    == "www.landestate.co.uk"
})

print("Unique candidate listings:", len(links), flush=True)

if not links:
    raise SystemExit("No listings found. Previous data preserved.")

properties = []
failures = []

for url in links:
    try:
        page = fetch(url)

        flag = page.select_one(".images .flag")
        status = flag.get_text(" ", strip=True) if flag else ""

        if status.casefold() != "to let":
            print("Excluded:", status or "No status", url, flush=True)
            continue

        heading = page.find("h1")
        title = heading.get_text(" ", strip=True) if heading else ""

        price_element = page.select_one(
            ".elementor-widget-property-price .price"
        )
        price = (
            price_element.get_text(" ", strip=True)
            if price_element else ""
        )

        if not title or not price:
            failures.append(url)
            print("Missing title or price:", url, flush=True)
            continue

        properties.append({
            "title": title,
            "price": price,
            "url": url,
            "location": title + ", Kent, UK"
        })

        print("To Let:", title, "|", price, flush=True)

    except Exception as error:
        failures.append(url)
        print("ERROR:", url, repr(error), flush=True)

print("Confirmed To Let:", len(properties), flush=True)
print("Unverified listings:", len(failures), flush=True)

if not properties or failures:
    raise SystemExit(
        "Incomplete verification. Previous data preserved."
    )

output = {
    "updated": datetime.datetime.now(
        datetime.timezone.utc
    ).strftime("%Y-%m-%d %H:%M UTC"),
    "notice": "Public listings; confirm availability with Land Estates",
    "properties": properties
}

OUTPUT.write_text(
    json.dumps(output, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)

print("SUCCESS: Published", len(properties), "rental listings")
