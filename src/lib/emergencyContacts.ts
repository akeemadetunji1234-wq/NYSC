export type EmergencyCategory = "POLICE" | "HOSPITAL" | "NYSC_COORDINATOR" | "FIRE_SERVICE";
export type EmergencyContact = {
  state: string;
  category: EmergencyCategory;
  name: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT",
];

const NATIONAL_CONTACTS: EmergencyContact[] = [
  { state: "National", category: "POLICE", name: "Nigeria Police Emergency", phone: "199", notes: "National emergency line; availability may vary by network." },
  { state: "National", category: "FIRE_SERVICE", name: "Federal Fire Service", phone: "112", notes: "National emergency line; confirm local availability." },
  { state: "National", category: "HOSPITAL", name: "Emergency Services", phone: "112", notes: "Use for urgent emergencies and request the nearest facility." },
];

const VERIFIED_STATE_CONTACTS: EmergencyContact[] = [
  { state: "Lagos", category: "POLICE", name: "Lagos State Police Command", phone: "012631200", notes: "Confirm current availability when safe." },
  { state: "FCT", category: "POLICE", name: "FCT Police Command", phone: "08061581938", notes: "Confirm current availability when safe." },
  { state: "Oyo", category: "POLICE", name: "Oyo State Police Command", phone: "08081777777", notes: "Confirm current availability when safe." },
  { state: "Rivers", category: "POLICE", name: "Rivers State Police Command", phone: "08032003514", notes: "Confirm current availability when safe." },
];

// Every state has an actionable fallback instead of disappearing from the selector.
// These are deliberately labeled as fallback lines and must not be presented as
// state-specific official numbers without an authoritative data refresh.
const STATE_FALLBACKS: EmergencyContact[] = NIGERIAN_STATES.flatMap((state) => [
  { state, category: "POLICE", name: `${state} emergency police fallback`, phone: "112", notes: "Fallback national emergency line. Verify the current local command number when safe." },
  { state, category: "HOSPITAL", name: `${state} emergency medical fallback`, phone: "112", notes: "Fallback emergency line. Ask for the nearest appropriate medical facility." },
  { state, category: "FIRE_SERVICE", name: `${state} fire emergency fallback`, phone: "112", notes: "Fallback national emergency line. Verify local fire-service availability." },
]);

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  ...NATIONAL_CONTACTS,
  ...STATE_FALLBACKS,
  ...VERIFIED_STATE_CONTACTS,
];

export const EMERGENCY_CATEGORIES: Record<EmergencyCategory, string> = {
  POLICE: "Police",
  HOSPITAL: "Hospital",
  NYSC_COORDINATOR: "NYSC Coordinator",
  FIRE_SERVICE: "Fire Service",
};
