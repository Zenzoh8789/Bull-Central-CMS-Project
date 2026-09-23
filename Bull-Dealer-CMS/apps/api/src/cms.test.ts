import test from "node:test";
import assert from "node:assert/strict";
import defaults from "@bull/content";
import { validateSection, resolveContent, sectionKeys } from "./cms/content";
import { hashPassword, verifyPassword, assertScope } from "./cms/auth";
test("all 20 audited section defaults validate", () => {
  assert.equal(sectionKeys.length, 20);
  for (const key of sectionKeys)
    assert.doesNotThrow(() => validateSection(key, defaults[key]));
});
test("schema rejects missing fields, unknown sections and unsafe URLs", () => {
  assert.throws(() => validateSection("unknown", {}));
  assert.throws(() => validateSection("about", { enabled: true }));
  const copy = structuredClone(defaults.about);
  copy.buttonUrl = "javascript:alert(1)";
  assert.throws(() => validateSection("about", copy));
  copy.buttonUrl = "//evil.test";
  assert.throws(() => validateSection("about", copy));
});
test("original contact fields and section coverage cannot be removed", () => {
  const contact = structuredClone(defaults.contact);
  contact.fields.pop();
  assert.throws(() => validateSection("contact", contact));
  const layout = structuredClone(defaults.pageLayout);
  layout.sections.pop();
  assert.throws(() => validateSection("pageLayout", layout));
});
test("resolution is independent of row order and uses explicit override last", () => {
  const rows = ["OVERRIDE", "COMMON", "DEALER", "GROUP"].map((layer) => ({
    layer,
    section_key: "about",
    document: { ...defaults.about, heading: layer },
  }));
  const resolved = resolveContent(rows);
  assert.equal(resolved.content.about.heading, "OVERRIDE");
  assert.equal(resolved.sources.about, "OVERRIDE");
  assert.equal(
    resolveContent(rows.filter((r) => r.layer !== "OVERRIDE")).content.about
      .heading,
    "DEALER",
  );
  assert.equal(
    resolveContent(rows.filter((r) => ["COMMON", "GROUP"].includes(r.layer)))
      .content.about.heading,
    "GROUP",
  );
});
test("password verification and dealer scope boundaries", () => {
  const hash = hashPassword("test-passphrase-123");
  assert.equal(verifyPassword("test-passphrase-123", hash), true);
  assert.equal(verifyPassword("incorrect", hash), false);
  const actor = {
    id: 1,
    name: "A",
    email: "a@test.local",
    role: "DEALER_ADMIN" as const,
    dealer_id: 1,
  };
  assert.doesNotThrow(() => assertScope(actor, "OVERRIDE", 1));
  assert.throws(() => assertScope(actor, "DEALER", 2));
  assert.throws(() => assertScope(actor, "COMMON", 0));
});
