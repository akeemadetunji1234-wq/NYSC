import math
import re
from pathlib import Path

SOURCE = Path(__file__).parents[1] / "src" / "data" / "nigerianEssentials.ts"
text = SOURCE.read_text(encoding="utf-8")

records = []
for block in re.findall(r"\{\s*id:\s*\"([^\"]+)\"(.*?)(?=\n\s*\},)", text, re.S):
    record_id, body = block
    def value(pattern):
        match = re.search(pattern, body)
        return match.group(1) if match else None
    category = value(r'category:\s*\"([^\"]+)\"')
    lat = value(r'lat:\s*([-\d.]+)')
    lng = value(r'lng:\s*([-\d.]+)')
    name = value(r'name:\s*\"([^\"]+)\"')
    if category and lat and lng and name:
        records.append({"id": record_id, "category": category, "lat": float(lat), "lng": float(lng), "name": name})


def distance_km(a_lat, a_lng, b_lat, b_lng):
    radius = 6371
    lat_delta = math.radians(b_lat - a_lat)
    lng_delta = math.radians(b_lng - a_lng)
    a = math.sin(lat_delta / 2) ** 2 + math.cos(math.radians(a_lat)) * math.cos(math.radians(b_lat)) * math.sin(lng_delta / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

samples = {
    "Lagos": (6.6018, 3.3515),
    "Abuja": (9.0723, 7.4201),
}
required = {"supermarkets", "restaurants", "pharmacies"}
for city, (lat, lng) in samples.items():
    nearby = [
        record for record in records
        if distance_km(lat, lng, record["lat"], record["lng"]) <= 25
    ]
    categories = {record["category"] for record in nearby}
    missing = required - categories
    print(f"{city}: {len(nearby)} curated places within 25 km; categories={sorted(categories)}")
    for record in sorted(nearby, key=lambda item: distance_km(lat, lng, item["lat"], item["lng"]))[:5]:
        distance = distance_km(lat, lng, record["lat"], record["lng"])
        print(f"  - {record['name']} [{record['category']}] {distance:.2f} km")
    if missing:
        raise SystemExit(f"{city} is missing categories: {sorted(missing)}")

print(f"PASS: parsed {len(records)} curated records and covered supermarkets, restaurants, and pharmacies in both sample cities.")
