export type EmergencyCategory = "POLICE" | "HOSPITAL" | "NYSC_COORDINATOR" | "FIRE_SERVICE";
export type EmergencyContact = {
  state: string;
  category: EmergencyCategory;
  name: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
  sourceStatus?: "national-fallback" | "state-entry-pending-verification";
};

export const EMERGENCY_CONTACT_DATA_PLAN = [
  "Use 112 for urgent emergencies when a local number has not been independently verified; do not present 112 as a state police, hospital, fire, or NYSC office number.",
  "Collect each state police command and NYSC secretariat number from an official government or agency publication, then confirm it through a second official channel before publishing.",
  "Record the source URL, verification date, verifying staff member, and category for every state entry; never infer, recycle, or generate a phone number.",
  "Refresh the directory quarterly and immediately remove or quarantine numbers reported as incorrect until reverified.",
] as const;

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT",
];

const NATIONAL_CONTACTS: EmergencyContact[] = [
  { state: "National", category: "POLICE", name: "National emergency fallback", phone: "112", sourceStatus: "national-fallback", notes: "Use for urgent emergencies when a local line is unavailable; ask the dispatcher for the nearest police, fire, or medical service." },
];

const STATE_ENTRIES_PENDING_VERIFICATION: EmergencyContact[] = [
  { state: "Lagos", category: "POLICE", name: "Lagos State Police Command (pending verification)", phone: "012631200", sourceStatus: "state-entry-pending-verification", notes: "Legacy entry retained for review; confirm through an official current publication before relying on it." },
  { state: "FCT", category: "POLICE", name: "FCT Police Command (pending verification)", phone: "08061581938", sourceStatus: "state-entry-pending-verification", notes: "Legacy entry retained for review; confirm through an official current publication before relying on it." },
  { state: "Oyo", category: "POLICE", name: "Oyo State Police Command (pending verification)", phone: "08081777777", sourceStatus: "state-entry-pending-verification", notes: "Legacy entry retained for review; confirm through an official current publication before relying on it." },
  { state: "Rivers", category: "POLICE", name: "Rivers State Police Command (pending verification)", phone: "08032003514", sourceStatus: "state-entry-pending-verification", notes: "Legacy entry retained for review; confirm through an official current publication before relying on it." },
];

// Every state has an actionable fallback instead of disappearing from the selector.
// These are deliberately labeled as fallback lines and must not be presented as
// state-specific official numbers without an authoritative data refresh.
const STATE_FALLBACKS: EmergencyContact[] = NIGERIAN_STATES.flatMap((state) => [
  { state, category: "POLICE", name: `${state} police fallback`, phone: "112", sourceStatus: "national-fallback", notes: "Fallback only—not a state police number. Ask the dispatcher for the nearest local police command." },
  { state, category: "HOSPITAL", name: `${state} medical fallback`, phone: "112", sourceStatus: "national-fallback", notes: "Fallback only—not a hospital number. Ask the dispatcher for the nearest appropriate medical facility." },
  { state, category: "FIRE_SERVICE", name: `${state} fire fallback`, phone: "112", sourceStatus: "national-fallback", notes: "Fallback only—not a state fire-service number. Ask the dispatcher for the nearest response team." },
]);

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  ...NATIONAL_CONTACTS,
  ...STATE_FALLBACKS,
  ...STATE_ENTRIES_PENDING_VERIFICATION,
];

export const EMERGENCY_CATEGORIES: Record<EmergencyCategory, string> = {
  POLICE: "Police",
  HOSPITAL: "Hospital",
  NYSC_COORDINATOR: "NYSC Coordinator",
  FIRE_SERVICE: "Fire Service",
};
