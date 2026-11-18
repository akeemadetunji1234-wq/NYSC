import assert from "node:assert/strict";
import { parseRentDueDate } from "../src/lib/rentDueDate.ts";

const morningInLagos = new Date("2026-11-12T08:35:00.000Z");
assert.equal(parseRentDueDate("2026-11-12", morningInLagos).toISOString(), "2026-11-12T12:00:00.000Z");
assert.throws(() => parseRentDueDate("2026-11-11", morningInLagos), /today or in the future/);
assert.throws(() => parseRentDueDate("12/11/2026", morningInLagos), /valid due date/);

console.log(JSON.stringify({ ok: true }));
