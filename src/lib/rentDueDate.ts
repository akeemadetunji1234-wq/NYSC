export function lagosDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Calendar dates are interpreted in Africa/Lagos. Today is allowed. */
export function parseRentDueDate(value: unknown, now = new Date()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error("Enter a valid due date.");
  }
  const raw = value.trim();
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== day) {
    throw new Error("Enter a valid due date.");
  }
  if (raw < lagosDateKey(now)) {
    throw new Error("Due date must be today or in the future.");
  }
  return date;
}
