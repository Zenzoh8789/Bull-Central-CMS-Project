import test from "node:test";
import assert from "node:assert/strict";
import defaults from "@bull/content";
import { normalizeEditorSection, youtubeId } from "@bull/content/editing";
import { validateSection, resolveContent } from "./cms/content";

test("legacy testimonials receive editable text without replacing video IDs", () => {
  const legacy = structuredClone(defaults.testimonials);
  for (const item of legacy.items) {
    delete item.title;
    delete item.description;
  }
  const saved: any = validateSection("testimonials", legacy);
  assert.equal(saved.items[0].description, "");
  saved.items[0].description = "Customer supplied paragraph";
  assert.equal(
    (validateSection("testimonials", saved) as any).items[0].description,
    "Customer supplied paragraph",
  );
});
test("statistics upgrades older lists to exactly five entries", () => {
  for (const length of [0, 2, 4, 5, 6]) {
    const content = {
      ...defaults.statistics,
      items: Array.from({ length }, () => ({
        ...defaults.statistics.items[0],
      })),
    };
    assert.equal(
      (validateSection("statistics", content) as any).items.length,
      5,
    );
  }
});
test("legacy product headings retain resolved equipment and menu content", () => {
  const old = structuredClone(defaults.products);
  delete old.categories;
  delete old.menuHeading;
  const equipment = structuredClone(defaults.equipment);
  equipment.categories[0].heading = "Custom backhoe heading";
  const resolved = resolveContent([
    { layer: "COMMON", section_key: "equipment", document: equipment },
    {
      layer: "DEALER",
      section_key: "navigation",
      document: { ...defaults.navigation, productsLabel: "Machines" },
    },
    { layer: "OVERRIDE", section_key: "products", document: old },
  ]);
  assert.equal(
    resolved.content.products.categories[0].heading,
    "Custom backhoe heading",
  );
  assert.equal(resolved.content.products.menuHeading, "Machines");
  assert.doesNotThrow(() =>
    validateSection("products", resolved.content.products),
  );
});
test("YouTube links and iframes normalize to IDs without executing HTML", () => {
  for (const input of [
    "m2VSTjDi0nA",
    "https://youtu.be/m2VSTjDi0nA",
    "https://www.youtube.com/watch?v=m2VSTjDi0nA&t=10",
    "https://www.youtube.com/shorts/m2VSTjDi0nA",
    '<iframe src="https://www.youtube-nocookie.com/embed/m2VSTjDi0nA"></iframe>',
  ])
    assert.equal(youtubeId(input), "m2VSTjDi0nA");
  for (const input of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=m2VSTjDi0nA",
    "<script>alert(1)</script>",
    "https://www.youtube.com/embed/invalid",
  ])
    assert.equal(youtubeId(input), null);
});
test("new metadata is compatible with legacy SEO and validates theme color", () => {
  const legacy = structuredClone(defaults.seo);
  delete legacy.keywords;
  delete legacy.robots;
  delete legacy.author;
  delete legacy.themeColor;
  assert.equal(normalizeEditorSection("seo", legacy).robots, "index, follow");
  assert.doesNotThrow(() => validateSection("seo", legacy));
  assert.throws(() => validateSection("seo", { ...legacy, themeColor: "bad" }));
});
