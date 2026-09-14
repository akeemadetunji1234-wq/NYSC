export type EmergencyCategory = "POLICE" | "HOSPITAL" | "NYSC_COORDINATOR" | "FIRE_SERVICE";
export type EmergencyContact = { state: string; category: EmergencyCategory; name: string; phone: string; whatsapp?: string; notes?: string };

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { state: "National", category: "POLICE", name: "Nigeria Police Emergency", phone: "199", notes: "National emergency line; availability may vary by network." },
  { state: "National", category: "FIRE_SERVICE", name: "Federal Fire Service", phone: "112", notes: "National emergency line; confirm local availability." },
  { state: "National", category: "HOSPITAL", name: "Emergency Services", phone: "112", notes: "Use for urgent emergencies and request the nearest facility." },
  { state: "Lagos", category: "POLICE", name: "Lagos State Police Command", phone: "012631200" },
  { state: "FCT", category: "POLICE", name: "FCT Police Command", phone: "08061581938" },
  { state: "Oyo", category: "POLICE", name: "Oyo State Police Command", phone: "08081777777" },
  { state: "Rivers", category: "POLICE", name: "Rivers State Police Command", phone: "08032003514" },
];

export const EMERGENCY_CATEGORIES: Record<EmergencyCategory, string> = { POLICE: "Police", HOSPITAL: "Hospital", NYSC_COORDINATOR: "NYSC Coordinator", FIRE_SERVICE: "Fire Service" };
