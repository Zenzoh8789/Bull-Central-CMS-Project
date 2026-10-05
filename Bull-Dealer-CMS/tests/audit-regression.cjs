const fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict"),
  mysql = require("mysql2/promise"),
  crypto = require("crypto"),
  http = require("http");
const { spawn, spawnSync } = require("child_process");
const defaults = require("../apps/content");
const { hashPassword } = require("../apps/api/dist/cms/auth");
const { normalizeBanners } = require("../apps/content/banners");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {
  timestamp: new Date().toISOString(),
  baseSha256:
    "1D4059FBB097D2C7BACAB868849DE5D5673EB4F801510940A09CBEF8F736253C",
  checks: [],
  requests: [],
  browserErrors: [],
};
const check = (s) => {
  results.checks.push(s);
  console.log("PASS " + s);
};
const root = path.resolve(__dirname, ".."),
  apiPort = 30316,
  webPort = 5273,
  adminPort = 5274;
const children = [];
let db, browser;
function start(args, env, label) {
  const log = fs.openSync(path.join(root, ".local", label + ".log"), "w");
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    windowsHide: true,
    stdio: ["ignore", log, log],
  });
  children.push(child);
  return child;
}
async function ready(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(250);
  }
  throw Error("Server did not start " + url);
}
async function request(
  method,
  url,
  body,
  token,
  status = 200,
  host = "bulltaraautohub.com",
) {
  const response = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: apiPort,
        path: "/api/" + url,
        method,
        headers: {
          Host: host,
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(body !== undefined
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(JSON.stringify(body)),
              }
            : {}),
        },
      },
      (r) => {
        let text = "";
        r.on("data", (c) => (text += c));
        r.on("end", () =>
          resolve({
            status: r.statusCode,
            data: text ? JSON.parse(text) : null,
          }),
        );
      },
    );
    req.on("error", reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
  results.requests.push({
    method,
    path: "/api/" + url,
    status: response.status,
  });
  assert.equal(
    response.status,
    status,
    method + " " + url + " " + JSON.stringify(response.data),
  );
  return response.data;
}
(async () => {
  if (!process.env.TEST_DATABASE_URL)
    throw Error("TEST_DATABASE_URL must point to a disposable MySQL server.");
  fs.mkdirSync(path.join(root, ".local"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs", "audit"), { recursive: true });
  const connectionUrl = new URL(process.env.TEST_DATABASE_URL),
    dbName = "bull_approved_audit_" + Date.now();
  assert.match(dbName, /^bull_approved_audit_\d+$/);
  db = await mysql.createConnection({
    uri: connectionUrl.toString(),
    multipleStatements: true,
  });
  await db.query("CREATE DATABASE " + dbName);
  connectionUrl.pathname = "/" + dbName;
  const env = {
    DATABASE_URL: connectionUrl.toString(),
    DEMO_MODE: "false",
    LOCAL_DEALER_DOMAIN: "bulltaraautohub.com",
    MEDIA_DIR: path.join(root, ".local", "audit-uploads"),
    PORT: String(apiPort),
    API_TARGET: "http://127.0.0.1:" + apiPort,
    WEB_TARGET: "http://127.0.0.1:" + webPort,
  };
  const migration = spawnSync(process.execPath, ["infra/scripts/migrate.cjs"], {
    cwd: root,
    env: { ...process.env, ...env },
    windowsHide: true,
    encoding: "utf8",
  });
  assert.equal(migration.status, 0, migration.stderr);
  await db.query("USE " + dbName);
  await db.execute(
    "INSERT INTO dealers(id,name,location,address,about,active,state,district) VALUES (2,'Audit Dealer Two','Kerala','Audit address','Audit profile',1,'Kerala','Audit district')",
  );
  await db.execute(
    "INSERT INTO dealer_domains(domain,dealer_id) VALUES ('dealer2.test',2)",
  );
  await db.execute("UPDATE dealers SET state='Bihar' WHERE id=1");
  const password = crypto.randomBytes(24).toString("hex");
  for (const [username, role, owner] of [
    ["audit-admin", "SUPER_ADMIN", null],
    ["audit-editor", "EDITOR", null],
    ["audit-dealer", "DEALER_ADMIN", 2],
  ])
    await db.execute(
      "INSERT INTO cms_users(username,name,password_hash,role,dealer_id) VALUES (?,?,?,?,?)",
      [username, username, hashPassword(password), role, owner],
    );
  start(["apps/api/dist/main.js"], env, "audit-api");
  await ready("http://127.0.0.1:" + apiPort + "/api/health");
  const login = async (username) =>
    (
      await request(
        "POST",
        "auth/login",
        { username, password },
        undefined,
        201,
      )
    ).token;
  const admin = await login("audit-admin"),
    editor = await login("audit-editor"),
    dealer = await login("audit-dealer");
  await request("POST", "auth/enter", { employeeId: null }, admin, 201);
  for (const endpoint of [
    "dashboard",
    "registry",
    "common/resolved",
    "dealers",
    "groups",
    "drafts",
    "history",
    "users",
    "enquiries",
    "media",
    "activity",
    "employees",
    "dealers/1/resolved",
  ])
    await request("GET", "admin/" + endpoint, undefined, admin);
  await request("GET", "health");
  const initial = await request("GET", "site");
  assert.equal(initial.content.banners.items.length, 0);
  await request("GET", "products");
  await request("GET", "products/" + initial.products[0].id);
  await request("GET", "products/unknown", undefined, undefined, 404);
  await request("GET", "site", undefined, undefined, 404, "unknown.test");
  await request("GET", "admin/drafts", undefined, undefined, 401);
  await request("GET", "admin/dealers/1/resolved", undefined, dealer, 403);
  await request("GET", "admin/common/resolved", undefined, dealer, 403);
  check(
    "All public and admin GET endpoints, 401/403/404 boundaries, database-driven empty banner list",
  );
  const doc = {
    ...normalizeBanners(defaults.banners),
    items: [
      {
        image: "/images/backhoe.png",
        alt: "Audit banner",
        url: "",
        title: "Audit banner",
        images: [
          "/images/backhoe.png",
          "/images/loader.png",
          "/images/skid.png",
        ],
        states: ["ALL"],
        enabled: true,
      },
    ],
  };
  const save = (
    layer,
    ownerId,
    document,
    expectedRevision = 0,
    token = admin,
  ) =>
    request(
      "POST",
      "admin/drafts",
      { layer, ownerId, section: "banners", document, expectedRevision },
      token,
      201,
    );
  let common = await save("COMMON", 0, doc);
  assert.ok(common.published);
  assert.equal(common.document.items[0].images.length, 3);
  let own = await save(
    "OVERRIDE",
    2,
    {
      ...doc,
      items: [{ ...doc.items[0], title: "Dealer-only", states: ["Kerala"] }],
    },
    0,
    dealer,
  );
  assert.ok(own.published);
  common = await save(
    "COMMON",
    0,
    { ...doc, items: [{ ...doc.items[0], title: "Common update" }] },
    common.revision,
  );
  assert.equal(
    (await request("GET", "site", undefined, undefined, 200, "dealer2.test"))
      .content.banners.items[0].title,
    "Dealer-only",
  );
  assert.equal(
    (await request("GET", "site")).content.banners.items[0].title,
    "Common update",
  );
  check(
    "Common and dealer banner ownership stays separate through draft storage, publishing and public responses",
  );
  own = await save(
    "OVERRIDE",
    2,
    { ...own.document, items: [{ ...own.document.items[0], enabled: false }] },
    own.revision,
    dealer,
  );
  assert.equal(
    require("../apps/content/banners").bannerSlides(
      (await request("GET", "site", undefined, undefined, 200, "dealer2.test"))
        .content.banners,
    ).length,
    0,
  );
  own = await save(
    "OVERRIDE",
    2,
    { ...own.document, items: [] },
    own.revision,
    dealer,
  );
  const [[ownRow]] = await db.execute(
    "SELECT document FROM cms_live WHERE dealer_id=2 AND layer='OVERRIDE' AND section_key='banners'",
  );
  assert.equal(
    (typeof ownRow.document === "string"
      ? JSON.parse(ownRow.document)
      : ownRow.document
    ).items.length,
    0,
  );
  assert.equal(
    (await request("GET", "site", undefined, undefined, 200, "dealer2.test"))
      .content.banners.items.length,
    0,
  );
  check(
    "Inactive banners do not render; dealer banner deletion is durable and does not resurrect common banners",
  );
  await request(
    "POST",
    "admin/drafts",
    {
      layer: "COMMON",
      ownerId: 0,
      section: "banners",
      document: doc,
      expectedRevision: 0,
    },
    admin,
    409,
  );
  for (const body of [
    {},
    {
      layer: "COMMON",
      ownerId: 2,
      section: "banners",
      document: doc,
      expectedRevision: 0,
    },
    {
      layer: "COMMON",
      ownerId: 0,
      section: "banners",
      document: {
        ...doc,
        items: [{ ...doc.items[0], images: ["javascript:alert(1)"] }],
      },
      expectedRevision: common.revision,
    },
    {
      layer: "COMMON",
      ownerId: 0,
      section: "banners",
      document: doc,
      expectedRevision: common.revision,
      removeOverride: "false",
    },
  ]) {
    const e = await request("POST", "admin/drafts", body, admin, 400);
    assert.ok(e.message);
  }
  await request(
    "POST",
    "admin/drafts",
    {
      layer: "COMMON",
      ownerId: 0,
      section: "banners",
      document: doc,
      expectedRevision: common.revision,
    },
    dealer,
    403,
  );
  check(
    "Malformed draft payloads give actionable 400 responses; stale revisions give 409 and scope manipulation gives 403",
  );
  const draft = await request(
    "POST",
    "admin/drafts",
    {
      layer: "COMMON",
      ownerId: 0,
      section: "news",
      document: defaults.news,
      expectedRevision: 0,
    },
    editor,
    201,
  );
  assert.equal(draft.published, false);
  const pbody = {
    draftIds: [draft.id],
    revisions: { [draft.id]: draft.revision },
    target: { mode: "ALL" },
  };
  await request("POST", "admin/publish/preview", pbody, editor, 403);
  const preview = await request(
    "POST",
    "admin/publish/preview",
    pbody,
    admin,
    201,
  );
  await request(
    "POST",
    "admin/publish",
    { ...pbody, previewHash: preview.previewHash },
    admin,
    201,
  );
  await request(
    "DELETE",
    "admin/drafts/" + draft.id,
    { expectedRevision: 0 },
    admin,
    409,
  );
  await request(
    "DELETE",
    "admin/drafts/" + draft.id,
    { expectedRevision: draft.revision },
    admin,
  );
  const [[draftCount]] = await db.execute(
    "SELECT COUNT(*) AS count FROM cms_drafts WHERE id=?",
    [draft.id],
  );
  assert.equal(draftCount.count, 0);
  const [[liveCount]] = await db.execute(
    "SELECT COUNT(*) AS count FROM cms_live WHERE section_key='news'",
  );
  assert.equal(liveCount.count, 2);
  check(
    "Editor draft creation, explicit preview/publish, revision-checked draft deletion retain published content",
  );
  // Return common banners to an empty saved document before the real UI flow.
  common = await save(
    "COMMON",
    0,
    { ...common.document, items: [] },
    common.revision,
  );
  const [[commonRow]] = await db.execute(
    "SELECT document FROM cms_live WHERE dealer_id=1 AND layer='COMMON' AND section_key='banners'",
  );
  assert.equal(
    (typeof commonRow.document === "string"
      ? JSON.parse(commonRow.document)
      : commonRow.document
    ).items.length,
    0,
  );
  check("Common banner deletion is durable in MySQL and public site output");
  // Browser fixtures stay exclusively inside this disposable database.
  const employee = await request(
    "POST",
    "admin/employees",
    { name: "Audit QA", department: "QA", active: true },
    admin,
    201,
  );
  start(
    [
      "node_modules/vite/bin/vite.js",
      "--config",
      "apps/web/vite.config.ts",
      "--host",
      "127.0.0.1",
      "--port",
      String(webPort),
      "apps/web",
    ],
    env,
    "audit-web",
  );
  start(
    [
      "node_modules/vite/bin/vite.js",
      "--config",
      "apps/admin/vite.config.ts",
      "--host",
      "127.0.0.1",
      "--port",
      String(adminPort),
      "apps/admin",
    ],
    env,
    "audit-admin",
  );
  await ready("http://127.0.0.1:" + webPort);
  await ready("http://127.0.0.1:" + adminPort + "/admin/");
  const { chromium } = require(
    process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
  );
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => results.browserErrors.push(e.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("http://127.0.0.1:" + adminPort + "/admin/login");
  await page.locator("[name=username]").fill("audit-admin");
  await page.locator("[name=password]").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: /Audit QA/ }).click();
  await page.getByRole("button", { name: "Continue as Audit QA" }).click();
  await page.waitForURL(/\/admin\/?$/);
  await page.screenshot({
    path: path.join(root, "docs/audit/admin-desktop.png"),
  });
  await page.getByRole("link", { name: "Banners", exact: true }).click();
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  const png = fs.readFileSync(
    path.join(root, "apps/web/public/images/backhoe.png"),
  );
  await page.getByLabel("Banner images").setInputFiles(
    [1, 2, 3].map((i) => ({
      name: "audit-" + i + ".png",
      mimeType: "image/png",
      buffer: png,
    })),
  );
  await page.waitForFunction(
    () => document.querySelectorAll(".banner-previews img").length === 3,
  );
  await page.getByLabel("Status", { exact: true }).selectOption("INACTIVE");
  await page.getByLabel("Status", { exact: true }).selectOption("ACTIVE");
  assert.equal(await page.locator(".banner-previews img").count(), 3);
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/drafts") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  const response = await responsePromise;
  assert.equal(response.status(), 201);
  const saved = await response.json();
  assert.equal(saved.document.items.length, 1);
  assert.equal(saved.document.items[0].images.length, 3);
  assert.equal(saved.document.items[0].enabled, true);
  assert.ok(saved.published);
  await page.locator(".banner-table tbody tr").waitFor();
  assert.equal(await page.locator(".banner-table tbody tr").count(), 1);
  assert.equal(await page.locator(".banner-thumbnails img").count(), 3);
  await page.screenshot({
    path: path.join(root, "docs/audit/banner-three-images.png"),
  });
  await page.getByRole("button", { name: "View", exact: true }).click();
  assert.equal(await page.locator(".banner-previews img").count(), 3);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  assert.equal(await page.locator(".banner-previews img").count(), 3);
  await page.getByLabel("Status", { exact: true }).selectOption("INACTIVE");
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  await page
    .locator(".banner-table")
    .getByText("Inactive", { exact: true })
    .waitFor();
  assert.equal(await page.locator(".banner-table tbody tr").count(), 1);
  check(
    "Real Admin login, three multipart uploads, preview retention, grouped save, edit/view reload, status and immediate table refresh",
  );
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("ACTIVE");
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  await page
    .locator(".banner-table")
    .getByText("All States", { exact: true })
    .waitFor();
  const web = await context.newPage();
  web.on("pageerror", (e) => results.browserErrors.push(e.message));
  await web.goto("http://127.0.0.1:" + webPort);
  await web.locator(".banner-image").first().waitFor();
  assert.equal(await web.locator(".banner-image").count(), 3);
  await web.screenshot({
    path: path.join(root, "docs/audit/website-desktop.png"),
  });
  await page.getByRole("button", { name: "Delete banner 1" }).click();
  await page.getByText("No banners yet. Add your first banner.").waitFor();
  await web.waitForFunction(
    () => document.querySelectorAll(".banner-image").length === 0,
    {},
    { timeout: 20000 },
  );
  const [[deleted]] = await db.execute(
    "SELECT document FROM cms_live WHERE dealer_id=1 AND layer='COMMON' AND section_key='banners'",
  );
  assert.equal(
    (typeof deleted.document === "string"
      ? JSON.parse(deleted.document)
      : deleted.document
    ).items.length,
    0,
  );
  check(
    "Real Admin banner delete updates MySQL, removes the table row, and removes website slides through the existing refresh cycle",
  );
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  await page.getByLabel("Banner images").setInputFiles({
    name: "failed-save.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.waitForFunction(
    () => document.querySelectorAll(".banner-previews img").length === 1,
  );
  await page.route("**/api/admin/drafts", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Audit simulated validation rejection",
          }),
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  await page
    .getByText("Audit simulated validation rejection", { exact: true })
    .first()
    .waitFor();
  assert.equal(await page.locator(".banner-table tbody tr").count(), 0);
  assert.equal(await page.locator(".banner-previews img").count(), 1);
  await page.unroute("**/api/admin/drafts");
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  await page.locator(".banner-table tbody tr").waitFor();
  assert.equal(await page.locator(".banner-table tbody tr").count(), 1);
  check(
    "Rejected save rolls back table state, keeps selected images and permits a successful retry",
  );

  await page.goto("http://127.0.0.1:" + adminPort + "/admin/dealers");
  await page
    .getByRole("button", { name: "Edit Audit Dealer Two", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Dealer website sections" })
    .getByRole("button", { name: "Banners", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  await page.getByLabel("Banner images").setInputFiles(
    [1, 2, 3].map((i) => ({
      name: "dealer-" + i + ".png",
      mimeType: "image/png",
      buffer: png,
    })),
  );
  await page.waitForFunction(
    () => document.querySelectorAll(".banner-previews img").length === 3,
  );
  await page.getByRole("checkbox", { name: "Kerala", exact: true }).check();
  const dealerSavePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/drafts") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  const dealerSave = await dealerSavePromise;
  assert.equal(dealerSave.status(), 201);
  const dealerSaved = await dealerSave.json();
  assert.equal(dealerSaved.layer, "OVERRIDE");
  assert.equal(dealerSaved.owner_id, 2);
  assert.equal(dealerSaved.document.items[0].images.length, 3);
  assert.deepEqual(dealerSaved.document.items[0].states, ["Kerala"]);
  await page.locator(".banner-table tbody tr").waitFor();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Remove image 2" }).click();
  const imageEditResponse = page.waitForResponse((r) => r.url().endsWith("/api/admin/drafts") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Save banner", exact: true }).click();
  assert.equal((await imageEditResponse).status(), 201);
  await page.waitForFunction(
    () => document.querySelectorAll(".banner-thumbnails img").length === 2,
  );
  const deletionResponse = page.waitForResponse((r) => r.url().endsWith("/api/admin/drafts") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Delete banner 1" }).click();
  assert.equal((await deletionResponse).status(), 201);
  await page.getByText("No banners yet. Add your first banner.").waitFor();
  assert.equal(
    (await request("GET", "site", undefined, undefined, 200, "dealer2.test"))
      .content.banners.items.length,
    0,
  );
  assert.equal((await request("GET", "site")).content.banners.items.length, 1);
  await page.getByRole("button", { name: "Close popup", exact: true }).click();
  check(
    "Real dealer editor saves the correct scope, retains three images, edits without duplicates and deletes without changing Common",
  );
  for (const section of [
    "banners",
    "statistics",
    "products",
    "service",
    "testimonials",
    "news",
    "contact",
    "footer",
  ]) {
    await page.goto(
      "http://127.0.0.1:" + adminPort + "/admin/content?section=" + section,
    );
    await page.locator(".section-editor form").waitFor();
    assert.equal(await page.locator(".section-editor [role=alert]").count(), 0);
  }
  check(
    "All existing Common CMS navigation modules load without API or runtime errors",
  );
  for (const route of [
    "/about",
    "/products",
    "/products/sd76",
    "/testimonials",
    "/blog",
    "/contact",
  ]) {
    await web.goto("http://127.0.0.1:" + webPort + route);
    await web.locator("#main").waitFor();
    assert.equal(await web.locator(".api-message[role=alert]").count(), 0);
  }
  await web.goto("http://127.0.0.1:" + webPort);
  const footerDoc = structuredClone(defaults.footer);
  footerDoc.groups[0].heading = "Audit CMS Footer";
  await request(
    "POST",
    "admin/drafts",
    {
      layer: "COMMON",
      ownerId: 0,
      section: "footer",
      document: footerDoc,
      expectedRevision: 0,
    },
    admin,
    201,
  );
  await web
    .getByRole("heading", { name: "Audit CMS Footer", exact: true })
    .waitFor({ timeout: 20000 });
  const brandDoc = { ...defaults.branding, dealerAlt: "Audit CMS Dealer", dealerLogo: "/images/backhoe.png" };
  await request(
    "POST",
    "admin/drafts",
    {
      layer: "COMMON",
      ownerId: 0,
      section: "branding",
      document: brandDoc,
      expectedRevision: 0,
    },
    admin,
    201,
  );
  await web
    .getByAltText("Audit CMS Dealer", { exact: true })
    .waitFor({ timeout: 20000 });
  const productDoc = structuredClone(defaults.products);
  productDoc.items[0].name = "Audit Updated Product";
  productDoc.items[0].menuLabel = "Audit Updated Product";
  await request(
    "POST",
    "admin/drafts",
    {
      layer: "COMMON",
      ownerId: 0,
      section: "products",
      document: productDoc,
      expectedRevision: 0,
    },
    admin,
    201,
  );
  await web
    .getByRole("button", { name: productDoc.menuHeading, exact: true })
    .click();
  await web
    .locator(".products-menu-grid")
    .getByText("Audit Updated Product", { exact: true })
    .waitFor({ timeout: 20000 });
  await web.goto("http://127.0.0.1:" + webPort + "/products/sd76");
  await web
    .getByRole("heading", { name: "Audit Updated Product", exact: true })
    .waitFor();
  check(
    "Website routes open, and footer, dealer branding, product menu and product details follow published CMS data",
  );
  await web.goto("http://127.0.0.1:" + webPort);
  await page.goto(
    "http://127.0.0.1:" + adminPort + "/admin/content?section=banners",
  );
  await page.locator(".section-editor form").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(root, "docs/audit/admin-mobile.png"),
  });
  await web.setViewportSize({ width: 390, height: 844 });
  await web.screenshot({
    path: path.join(root, "docs/audit/website-mobile.png"),
  });
  assert.deepEqual(results.browserErrors, []);
  check(
    "Admin and Website open at desktop/mobile sizes with no browser runtime errors",
  );
  await request("POST", "auth/logout", {}, dealer, 201);
  await request("GET", "admin/drafts", undefined, dealer, 401);
  check("Logout revokes the backend session");
  results.success = true;
})()
  .catch((error) => {
    results.success = false;
    results.failure = error.stack;
    console.error(error.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    for (const child of children) child.kill();
    await delay(500);
    if (db) {
      try {
        const [[current]] = await db.query("SELECT DATABASE() AS name");
        if (/^bull_approved_audit_\d+$/.test(current.name || ""))
          await db.query("DROP DATABASE " + current.name);
      } finally {
        await db.end();
      }
    }
    fs.writeFileSync(
      path.join(root, "docs", "AUDIT-RESULTS.json"),
      JSON.stringify(results, null, 2),
    );
  });
