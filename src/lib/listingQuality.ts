export type ListingQualityInput = {
  title?: string | null;
  description?: string | null;
  state?: string | null;
  location?: string | null;
};

const PLACE_RULES: { pattern: RegExp; state: string }[] = [
  { pattern: /\bibadan\b/i, state: "oyo" },
  { pattern: /\blagos\b/i, state: "lagos" },
  { pattern: /\bikeja\b/i, state: "lagos" },
  { pattern: /\babuja\b/i, state: "fct" },
  { pattern: /\bgwagwalada\b/i, state: "fct" },
  { pattern: /\bkuje\b/i, state: "fct" },
  { pattern: /\bmakurdi\b/i, state: "benue" },
  { pattern: /\bgboko\b/i, state: "benue" },
  { pattern: /\benugu\b/i, state: "enugu" },
  { pattern: /\bkano\b/i, state: "kano" },
  { pattern: /\bkaduna\b/i, state: "kaduna" },
  { pattern: /\bilorin\b/i, state: "kwara" },
  { pattern: /\bowerri\b/i, state: "imo" },
  { pattern: /\bwarri\b/i, state: "delta" },
  { pattern: /\bcalabar\b/i, state: "cross river" },
  { pattern: /\buyo\b/i, state: "akwa ibom" },
  { pattern: /\babeokuta\b/i, state: "ogun" },
  { pattern: /\bakure\b/i, state: "ondo" },
  { pattern: /\bosogbo\b/i, state: "osun" },
  { pattern: /\bjos\b/i, state: "plateau" },
  { pattern: /\bminna\b/i, state: "niger" },
  { pattern: /\blokoja\b/i, state: "kogi" },
  { pattern: /\bport harcourt\b/i, state: "rivers" },
];

export function canonicalListingState(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "fct" || normalized === "abuja" || normalized.includes("federal capital")) return "fct";
  return normalized;
}

export function isReadableListingText(value: string) {
  const text = value.trim();
  if (text.length < 40) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;
  const letters = text.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length < 30) return false;
  const vowels = letters.replace(/[^aeiou]/g, "").length;
  const ratio = vowels / letters.length;
  if (ratio < 0.28 || ratio > 0.62) return false;
  const longWords = words.filter((word) => word.replace(/[^a-z]/gi, "").length >= 4);
  if (longWords.length < 4) return false;
  const withVowel = longWords.filter((word) => /[aeiou]/i.test(word));
  return withVowel.length / longWords.length >= 0.75;
}

export function listingStateConflict(input: ListingQualityInput) {
  const state = canonicalListingState(input.state || "");
  if (!state) return true;
  const haystack = `${input.title || ""} ${input.location || ""}`;
  return PLACE_RULES.some((rule) => rule.pattern.test(haystack) && rule.state !== state);
}

export function isPublishableListing(input: ListingQualityInput) {
  if (!input.title || input.title.trim().length < 8) return false;
  if (!input.state?.trim()) return false;
  if (!isReadableListingText(input.description || "")) return false;
  return !listingStateConflict(input);
}

export const LISTING_QUALITY_ERROR =
  "Describe the lodge in plain language, and make sure the title matches the state you selected.";
