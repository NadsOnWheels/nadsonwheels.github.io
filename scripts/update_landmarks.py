
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

query = """
[out:json][timeout:90];
(
  nwr["amenity"="school"](51.35,-0.02,51.52,0.36);
  nwr["railway"="station"](51.35,-0.02,51.52,0.36);
);
out center;
"""

servers = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

data = None

for server in servers:
    try:
        request = urllib.request.Request(
            server,
            data=urllib.parse.urlencode(
                {"data": query}
            ).encode(),
            headers={
                "User-Agent": "NadsOnWheels/1.0"
            }
        )

        with urllib.request.urlopen(
            request, timeout=120
        ) as response:
            candidate = json.load(response)

        if candidate.get("elements") and not candidate.get("remark"):
            data = candidate
            break

    except Exception as error:
        print(f"{server}: {error}")

if data is None:
    raise RuntimeError(
        "Landmark download failed. Existing data preserved."
    )

landmarks = []
seen = set()

for item in data["elements"]:
    tags = item.get("tags", {})
    position = item.get("center", item)

    name = tags.get("name")
    lat = position.get("lat")
    lon = position.get("lon")

    if not name or lat is None or lon is None:
        continue

    kind = (
        "school"
        if tags.get("amenity") == "school"
        else "station"
    )

    key = (name, kind)

    if key in seen:
        continue

    seen.add(key)

    landmarks.append({
        "name": name,
        "kind": kind,
        "lat": lat,
        "lon": lon
    })

if not landmarks:
    raise RuntimeError("No landmarks found.")

output = {
    "updated": datetime.now(timezone.utc).strftime(
        "%Y-%m-%d %H:%M UTC"
    ),
    "source": "OpenStreetMap contributors",
    "landmarks": landmarks
}

(ROOT / "landmarks.json").write_text(
    json.dumps(output, indent=2, ensure_ascii=False),
    encoding="utf-8"
)

print(f"Saved {len(landmarks)} landmarks.")
