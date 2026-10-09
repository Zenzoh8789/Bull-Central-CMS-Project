import test from "node:test";
import assert from "node:assert/strict";
import defaults from "@bull/content";
import { registry, validateSection } from "./cms/content";

test("product add and delete preserve legacy image alternative text", () => {
  const doc = structuredClone(defaults.products);
  doc.items = doc.items.map(item => ({ ...item, alt: item.name, menuAlt: item.menuLabel }));
  const added = { ...doc.items[0], id: "product-new", name: "New product", menuLabel: "New product" };
  doc.items.push(added);
  const saved: any = validateSection("products", doc);
  assert.equal(saved.items.at(-1).id, "product-new");
  assert.equal(saved.items[0].alt, doc.items[0].name);
  saved.items = saved.items.filter((item: any) => item.id !== "product-new");
  assert.equal((validateSection("products", saved) as any).items.length, defaults.products.items.length);
  saved.items = [];
  assert.deepEqual((validateSection("products", saved) as any).items, []);
});

test("product registry and validation agree for old and new items", () => {
  const entry: any = registry().find(section => section.key === "products");
  assert.equal(entry.template.items[0].alt, "");
  assert.equal(entry.template.items[0].menuAlt, "");
  const saved: any = validateSection("products", defaults.products);
  assert.equal(saved.items[0].alt, "");
  assert.equal(saved.items[0].menuAlt, "");
  assert.throws(() => validateSection("products", { ...saved, items: [{ ...saved.items[0], alt: 42 }] }));
  assert.throws(() => validateSection("products", { ...saved, items: [{ ...saved.items[0], unexpected: "value" }] }));
  assert.throws(() => validateSection("products", { ...saved, items: [saved.items[0], saved.items[0]] }));
});
import { resolveContent } from "./cms/content";
import { CmsService } from "./cms/cms.service";

test("dealer websites use Common catalogue products over older dealer overrides", () => {
  const common = structuredClone(defaults.products);
  common.items[0].image = "/uploads/catalogue-product.webp";
  const dealer = structuredClone(defaults.products);
  dealer.items[0].image = "/uploads/old-dealer-image.webp";
  const resolved = resolveContent([
    { layer: "COMMON", section_key: "products", document: common },
    { layer: "OVERRIDE", section_key: "products", document: dealer },
  ]);
  assert.equal(resolved.sources.products, "COMMON");
  assert.equal(resolved.content.products.items[0].image, "/uploads/catalogue-product.webp");
});

test("product draft API rejects dealer and group product edits", async () => {
  const service: any = Object.create(CmsService.prototype);
  for (const layer of ["OVERRIDE", "DEALER", "GROUP"]) {
    await assert.rejects(service.saveDraft({ id: 1, role: "SUPER_ADMIN" }, {
      layer, ownerId: 1, section: "products", document: defaults.products, expectedRevision: 0,
    }), /Products can only be edited in Common selection/);
  }
});

test("Backhoe new style is optional and survives save validation", () => {
  const legacy: any = validateSection("products", defaults.products);
  assert.equal(legacy.items[0].newStyle, false);
  assert.equal(legacy.items[0].productModel, "");
  legacy.items[0].newStyle = true;
  legacy.items[0].productModel = "HIGH SPEED SERIES";
  const saved: any = validateSection("products", legacy);
  assert.equal(saved.items[0].newStyle, true);
  assert.equal(saved.items[0].productModel, "HIGH SPEED SERIES");
  saved.items[0].newStyle = false;
  assert.equal((validateSection("products", saved) as any).items[0].newStyle, false);
  const skid = saved.items.find((item: any) => item.category === "Skid steers");
  skid.newStyle = true;
  assert.throws(() => validateSection("products", saved), /only for Backhoe loaders/);
});
