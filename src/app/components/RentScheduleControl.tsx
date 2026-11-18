"use client";

import { useState } from "react";
import { cancelRentSchedule, setRentDueDate } from "../actions/rentSchedule";

export function RentScheduleControl({ bookingId, schedule }: { bookingId: string; schedule?: { dueDate: string | Date; recurrence: string } | null }) {
  const [date, setDate] = useState(schedule ? new Date(schedule.dueDate).toISOString().slice(0, 10) : "");
  const [recurrence, setRecurrence] = useState(schedule?.recurrence || "ANNUAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <div className="mt-2 space-y-1"><div className="flex items-center justify-end gap-1"><input type="date" value={date} onChange={(event) => { setDate(event.target.value); setError(null); }} className="rounded border px-2 py-1 text-xs" /><select value={recurrence} onChange={(event) => setRecurrence(event.target.value)} className="rounded border px-1 py-1 text-xs"><option value="ANNUAL">Annual</option><option value="ONE_TIME">One-time</option></select><button disabled={!date || saving} onClick={async () => { setSaving(true); setError(null); try { await setRentDueDate(bookingId, date, recurrence); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save the due date."); } finally { setSaving(false); } }} className="rounded bg-emerald-700 px-2 py-1 text-xs font-bold text-white">{saving ? "…" : "Save"}</button>{schedule && <button disabled={saving} onClick={async () => { setSaving(true); setError(null); try { await cancelRentSchedule(bookingId); setDate(""); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not cancel the schedule."); } finally { setSaving(false); } }} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">Cancel</button>}</div>{error && <p className="text-right text-[11px] text-red-600">{error}</p>}</div>;
}
