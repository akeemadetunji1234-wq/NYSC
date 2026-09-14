"use client";

import { useState } from "react";
import { cancelRentSchedule, setRentDueDate } from "../actions/rentSchedule";

export function RentScheduleControl({ bookingId, schedule }: { bookingId: string; schedule?: { dueDate: string | Date; recurrence: string } | null }) {
  const [date, setDate] = useState(schedule ? new Date(schedule.dueDate).toISOString().slice(0, 10) : "");
  const [recurrence, setRecurrence] = useState(schedule?.recurrence || "ANNUAL");
  const [saving, setSaving] = useState(false);
  return <div className="mt-2 flex items-center justify-end gap-1"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded border px-2 py-1 text-xs" /><select value={recurrence} onChange={(event) => setRecurrence(event.target.value)} className="rounded border px-1 py-1 text-xs"><option value="ANNUAL">Annual</option><option value="ONE_TIME">One-time</option></select><button disabled={!date || saving} onClick={async () => { setSaving(true); try { await setRentDueDate(bookingId, date, recurrence); } finally { setSaving(false); } }} className="rounded bg-emerald-700 px-2 py-1 text-xs font-bold text-white">{saving ? "…" : "Save"}</button>{schedule && <button disabled={saving} onClick={async () => { setSaving(true); try { await cancelRentSchedule(bookingId); setDate(""); } finally { setSaving(false); } }} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">Cancel</button>}</div>;
}
