import test from "node:test";
import assert from "node:assert/strict";
import { validateSection, resolveContent } from "./cms/content";
import { CmsService } from "./cms/cms.service";
const article = {
  slug: "new-launch",
  title: "New launch",
  date: "2026-09-23",
  image: "/uploads/news.jpg",
  body: "Article text",
};
const news = {
  enabled: true,
  heading: "NEWS AND UPDATES",
  bannerImage: "",
  description:
    "Latest news, product launches, events and updates from BULL Machines.",
  items: [article],
};
test("news validates uploaded images and dates, rejects duplicate slugs and invalid dates", () => {
  assert.deepEqual(validateSection("news", news), news);
  for (const patch of [
    { date: "2026-02-30" },
    { image: "javascript:alert(1)" },
    { title: "" },
    { body: "" },
  ])
    assert.throws(() =>
      validateSection("news", { ...news, items: [{ ...article, ...patch }] }),
    );
  assert.throws(() =>
    validateSection("news", { ...news, items: [article, article] }),
  );
});
test("news removes old seeded stories and URL fields without changing other sections", () => {
  const result = resolveContent([
    {
      layer: "COMMON",
      section_key: "news",
      document: {
        ...news,
        items: [
          { ...article, url: "https://example.com" },
          { url: "https://www.bullindia.com/bull-machines-unveils.php" },
        ],
      },
    },
  ]);
  assert.equal(result.content.news.items.length, 1);
  assert.equal("url" in result.content.news.items[0], false);
  assert.deepEqual(validateSection("news", { ...news, items: [] }).items, []);
});
for (const [layer, owner, target] of [
  ["COMMON", 0, { mode: "ALL" }],
  ["GROUP", 3, { mode: "GROUP", groupId: 3 }],
  ["DEALER", 2, { mode: "SINGLE", dealerIds: [2] }],
] as const) {
  test("saving news publishes only chosen " + layer + " scope", async () => {
    const service: any = Object.create(CmsService.prototype);
    service.repo = {
      pool: {
      getConnection() { return this; },
      async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
        execute: async (sql: string) =>
          sql.startsWith("SELECT * FROM cms_drafts")
            ? [[{ id: 9, revision: 1, document: news }]]
            : sql.startsWith("SELECT id")
              ? [[{ id: owner }]]
              : [{ affectedRows: 1 }],
      },
    };
    let published: any;
    service.preview = async (_a: any, b: any) => {
      assert.deepEqual(b.target, target);
      assert.deepEqual(b.draftIds, [9]);
      return { previewHash: "verified" };
    };
    service.publish = async (_a: any, b: any) => {
      published = b;
    };
    const result = await service.saveDraft(
      { id: 1, role: "SUPER_ADMIN" },
      {
        layer,
        ownerId: owner,
        section: "news",
        document: news,
        expectedRevision: 0,
      },
    );
    assert.equal(result.published, true);
    assert.equal(published.previewHash, "verified");
  });
}
test("editors cannot auto-publish news", async () => {
  const service: any = Object.create(CmsService.prototype);
  service.repo = {
    pool: {
      getConnection() { return this; },
      async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
      execute: async (sql: string) =>
        sql.startsWith("SELECT *")
          ? [[{ id: 9, revision: 1, document: news }]]
          : [{ affectedRows: 1 }],
    },
  };
  service.publish = () => assert.fail("Editor published");
  const result = await service.saveDraft(
    { id: 1, role: "EDITOR" },
    {
      layer: "COMMON",
      ownerId: 0,
      section: "news",
      document: news,
      expectedRevision: 0,
    },
  );
  assert.equal(result.published, false);
});

test("news registry exposes the same blog schema used to validate saved articles", async () => {
  const { registry } = await import("./cms/content");
  const definition = registry().find((entry) => entry.key === "news")!;
  const template = definition.template.items[0];
  for (const field of ["slug", "title", "date", "image", "body"])
    assert.equal(typeof template[field], "string");
  assert.equal("url" in template, false);
  assert.doesNotThrow(() => validateSection("news", definition.defaultValue));
  assert.equal(definition.defaultValue.items.length, 0);
});
test("previous packaged demo articles are removed while genuine user articles remain", () => {
  const demo = {
    ...article,
    slug: "demo-news-1",
    title: "Demo: Example",
    body: "Demo content for layout preview only.",
  };
  const result = resolveContent([
    {
      layer: "DEALER",
      section_key: "news",
      document: { ...news, items: [demo, article] },
    },
  ]);
  assert.deepEqual(result.content.news.items, [article]);
});

test("legacy categories are accepted and removed; new articles need no category", () => {
  const saved = validateSection("news", {
    ...news,
    items: [{ ...article, category: "Events" }],
  });
  assert.deepEqual(saved, news);
  assert.equal("category" in registryTemplate(), false);
});
function registryTemplate() {
  return require("@bull/content/news").newsTemplate.items[0];
}

test("News capability detection matches the registry and rejects old schemas", async () => {
  const { registry } = await import("./cms/content");
  const { supportsNewsArticles } = require("@bull/content/news");
  assert.equal(
    supportsNewsArticles(registry().find((entry) => entry.key === "news")),
    true,
  );
  assert.equal(
    supportsNewsArticles({ key: "news", template: { items: [{ url: "" }] } }),
    false,
  );
});

test('customized articles retain real text even when their legacy URL matches a former sample',()=>{
 const saved=validateSection('news',{...news,items:[{...article,url:'https://www.bullindia.com/bull-machines-unveils.php'}]});assert.deepEqual(saved.items,[article]);
});
test('malformed article titles produce validation errors instead of a normalizer TypeError',()=>{
 assert.throws(()=>validateSection('news',{...news,items:[{...article,slug:undefined,title:42}]}),error=>(error as any).getStatus?.()===400);
});
