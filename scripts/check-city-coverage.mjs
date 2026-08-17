const base = process.env.BASE_URL ?? "https://nysc-mu.vercel.app";
const cities = {
  Abuja: { lat: 9.0765, lng: 7.3986 },
  Lagos: { lat: 6.5244, lng: 3.3792 },
};
const categories = ["hospital", "bank", "transport", "security"];
for (const [city, origin] of Object.entries(cities)) {
  for (const category of categories) {
    const url = `${base}/api/nearby-essentials?category=${category}&lat=${origin.lat}&lng=${origin.lng}`;
    const response = await fetch(url, { headers: { accept: "application/json" } });
    const body = await response.json().catch(() => ({}));
    const places = Array.isArray(body.places) ? body.places : [];
    console.log(JSON.stringify({ city, category, status: response.status, count: places.length, maxDistanceKm: places.length ? Math.max(...places.map((p) => Number(p.distanceKm) || 0)) : null, samples: places.slice(0, 3).map((p) => ({ name: p.name, distanceKm: p.distanceKm, source: p.source })) }));
  }
}
