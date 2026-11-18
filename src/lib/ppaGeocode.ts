export type GeocodeHit = { id: string; label: string; lng: number; lat: number };

const STATE_CENTERS: Record<string, [number, number]> = {
  Abia: [7.5248, 5.4527],
  Adamawa: [12.3984, 9.3265],
  "Akwa Ibom": [7.8537, 4.9057],
  Anambra: [7.0068, 6.2209],
  Bauchi: [9.844, 10.3158],
  Bayelsa: [6.0699, 4.7719],
  Benue: [8.5088, 7.3369],
  Borno: [13.151, 11.8333],
  "Cross River": [8.3417, 5.8702],
  Delta: [6.1766, 5.5325],
  Ebonyi: [8.0137, 6.2649],
  Edo: [5.6037, 6.335],
  Ekiti: [5.22, 7.6233],
  Enugu: [7.5086, 6.4584],
  FCT: [7.3986, 9.0765],
  Gombe: [11.1667, 10.2897],
  Imo: [7.026, 5.492],
  Jigawa: [9.5616, 12.228],
  Kaduna: [7.4388, 10.5105],
  Kano: [8.5167, 12.0022],
  Katsina: [7.6006, 12.9908],
  Kebbi: [4.1975, 12.4539],
  Kogi: [6.6906, 7.8023],
  Kwara: [4.5418, 8.4966],
  Lagos: [3.3792, 6.5244],
  Nasarawa: [8.538, 8.4991],
  Niger: [6.547, 9.5836],
  Ogun: [3.3515, 7.1608],
  Ondo: [5.1478, 7.2508],
  Osun: [4.5624, 7.5629],
  Oyo: [3.947, 7.3775],
  Plateau: [8.8921, 9.2182],
  Rivers: [6.998, 4.8156],
  Sokoto: [5.2476, 13.0059],
  Taraba: [10.7739, 7.8704],
  Yobe: [11.966, 12.2939],
  Zamfara: [6.2236, 12.1704],
};

const STATE_NAMES = Object.keys(STATE_CENTERS).sort((a, b) => b.length - a.length);

export function expandAddressQuery(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bRd\.?\b/gi, "Road")
    .replace(/\bSt\.?\b/gi, "Street")
    .replace(/\bAve\.?\b/gi, "Avenue")
    .replace(/\bCl\.?\b/gi, "Close")
    .replace(/\bCres\.?\b/gi, "Crescent")
    .replace(/\bJct\.?\b/gi, "Junction")
    .replace(/\bSch\.?\b/gi, "School")
    .replace(/\bSec\.?\b/gi, "Secretariat")
    .replace(/\bHosp\.?\b/gi, "Hospital")
    .replace(/\bUniv\.?\b/gi, "University")
    .replace(/\bGovt\.?\b/gi, "Government")
    .replace(/\s*,\s*/g, ", ");
}

export function buildGeocodeQueries(query: string, area?: string | null) {
  const trimmed = query.trim().replace(/\s+/g, " ");
  if (trimmed.length < 3 || trimmed.length > 160) return [];
  const expanded = expandAddressQuery(trimmed);
  const place = (area || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const variants = [trimmed];
  if (expanded.toLowerCase() !== trimmed.toLowerCase()) variants.push(expanded);
  if (place) {
    variants.push(`${expanded}, ${place}`);
    if (!/\bnigeria\b/i.test(`${expanded} ${place}`)) variants.push(`${expanded}, ${place}, Nigeria`);
  } else if (!/\bnigeria\b/i.test(expanded)) {
    variants.push(`${expanded}, Nigeria`);
  }
  return [...new Set(variants)].slice(0, 4);
}

export function proximityForArea(area?: string | null, explicit?: string | null) {
  if (explicit && /^-?\d{1,3}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/.test(explicit)) return explicit;
  const text = area || "";
  for (const state of STATE_NAMES) {
    if (new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
      const [lng, lat] = STATE_CENTERS[state];
      return `${lng},${lat}`;
    }
  }
  return "8.6753,9.082";
}

export function dedupeGeocodeHits(hits: GeocodeHit[]) {
  const seen = new Set<string>();
  const results: GeocodeHit[] = [];
  for (const hit of hits) {
    if (!hit.label || !Number.isFinite(hit.lat) || !Number.isFinite(hit.lng)) continue;
    if (hit.lng < 2.4 || hit.lng > 15.1 || hit.lat < 4 || hit.lat > 14.1) continue;
    const key = `${hit.label.toLowerCase()}|${hit.lat.toFixed(3)}|${hit.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(hit);
    if (results.length >= 8) break;
  }
  return results;
}
