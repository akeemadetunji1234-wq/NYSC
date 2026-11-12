import assert from "node:assert/strict";
import { isPublishableListing } from "../src/lib/listingQuality.ts";

const good = {
  title: "Gwagwalada Double Room Lodge",
  state: "FCT",
  location: "Kuje",
  description:
    "Spacious double room apartment designed for two sharing corp members. Located close to the NYSC Gwagwalada Secretariat and Abuja University campus. Fully fenced with ample car parking space.",
};
assert.equal(isPublishableListing(good), true);

const junk = {
  title: "A big bedroom in gusabe mall ibadan",
  state: "FCT",
  location: "Municipal Area Council (AMAC)",
  description: "vsdmv jfd vf jdf mjkda fkmc dfjkfm fjkm dzn nfdfn djf d",
};
assert.equal(isPublishableListing(junk), false);

const readableButWrongState = {
  ...good,
  title: "Quiet room in Ibadan",
  state: "FCT",
};
assert.equal(isPublishableListing(readableButWrongState), false);

console.log(JSON.stringify({ ok: true }));
