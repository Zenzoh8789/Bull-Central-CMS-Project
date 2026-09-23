import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseHost, localHosts, products } from "./data";
test("normalises host casing and ports without accepting suffix lookalikes", () => {
  assert.equal(normaliseHost("BULLTARAAUTOHUB.COM:443"), "bulltaraautohub.com");
  assert.equal(normaliseHost("[::1]:3000"), "[::1]");
  assert.equal(localHosts.has(normaliseHost("localhost.attacker.test")), false);
  assert.notEqual(
    normaliseHost("bulltaraautohub.com.attacker.test"),
    "bulltaraautohub.com",
  );
});
test("catalogue has stable distinct IDs and local equipment assets", () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  for (const p of products) assert.match(p.image, /^\/images\/.+\.png$/);
});
