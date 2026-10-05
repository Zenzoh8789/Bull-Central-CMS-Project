require('../env.cjs');
const fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict"),
  mysql = require("mysql2/promise"),
  crypto = require("crypto"),
  { spawn } = require("child_process");
const defaults = require("../../apps/content");
const { hashPassword } = require("../../apps/api/dist/cms/auth");
(async () => {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error('Set TEST_DATABASE_URL to a MySQL account allowed to create disposable test databases. The working CMS database is never reset.');
  const testUrl = new URL(process.env.TEST_DATABASE_URL);
  const dbName = "bull_cms_test_" + Date.now();
  assert.match(dbName, /^bull_cms_test_\d+$/);
  const db = await mysql.createConnection({uri: testUrl.toString(), multipleStatements: true});
  testUrl.pathname = '/' + dbName;
  fs.mkdirSync('.local', {recursive: true});
  let server;
  const results = [];
  const check = (label) => {
    results.push(label);
    console.log("PASS " + label);
  };
  try {
    await db.query("CREATE DATABASE " + dbName + " CHARACTER SET utf8mb4");
    await db.query("USE " + dbName);
    await db.query(fs.readFileSync("infra/init.sql", "utf8"));
    await db.query(
      fs.readFileSync("infra/migrations/003_central_cms.sql", "utf8"),
    );
    await db.query(fs.readFileSync('infra/migrations/004_employees.sql','utf8'));
    await db.query("ALTER TABLE dealers ADD COLUMN state VARCHAR(100) NOT NULL DEFAULT '', ADD COLUMN district VARCHAR(100) NOT NULL DEFAULT ''");
    await db.query('ALTER TABLE cms_sessions ADD COLUMN employee_id INT NULL, ADD COLUMN cms_entered BOOLEAN NOT NULL DEFAULT FALSE');
    for (let id = 2; id <= 130; id++) {
      await db.execute("INSERT INTO dealers(id,name,location,address,about,active) VALUES (?,?,?,?,?,1)", [
        id,
        "Dealer " + id,
        "Test region",
        "Test address",
        "Test dealer profile",
      ]);
      await db.execute("INSERT INTO dealer_domains VALUES (?,?)", [
        "dealer" + id + ".test",
        id,
      ]);
    }
    const password = crypto.randomBytes(16).toString("hex");
    for (const [email, role, dealer] of [
      ["super@test.local", "SUPER_ADMIN", null],
      ["editor@test.local", "EDITOR", null],
      ["dealer@test.local", "DEALER_ADMIN", 2],
    ])
      await db.execute(
        "INSERT INTO cms_users(email,name,password_hash,role,dealer_id) VALUES (?,?,?,?,?)",
        [email, role, hashPassword(password), role, dealer],
      );
    await db.query(
      "INSERT INTO cms_groups(id,name) VALUES (1,'North'),(2,'South');INSERT INTO cms_group_members VALUES (1,2),(1,3),(2,4),(2,5)",
    );
    const log = fs.openSync(".local/integration-api.log", "w");
    server = spawn(process.execPath, ["apps/api/dist/main.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL:
          testUrl.toString(),
        DEMO_MODE: "false",
        PORT: "3002",
        MEDIA_DIR: path.resolve(".local/test-uploads"),
        MEDIA_STORAGE: "local",
      },
      stdio: ["ignore", log, log],
      windowsHide: true,
    });
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch("http://127.0.0.1:3002/api/health")).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    const request = async (method, url, body, token, expected = 200, host) => {
      const res = await new Promise((resolve, reject) => {
        const req = require("http").request(
          "http://127.0.0.1:3002/api/" + url,
          {
            method,
            headers: {
              ...(body ? { "Content-Type": "application/json" } : {}),
              ...(token ? { Authorization: "Bearer " + token } : {}),
              ...(host ? { Host: host } : {}),
            },
          },
          (r) => {
            let text = "";
            r.on("data", (c) => (text += c));
            r.on("end", () =>
              resolve({ status: r.statusCode, data: JSON.parse(text) }),
            );
          },
        );
        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
      assert.equal(
        res.status,
        expected,
        method + " " + url + " " + JSON.stringify(res.data),
      );
      return res.data;
    };
    const login = async (email) =>
      (await request("POST", "auth/login", { email, password }, null, 201))
        .token;
    const superToken = await login("super@test.local"),
      editor = await login("editor@test.local"),
      dealer = await login("dealer@test.local");
    await request("GET", "admin/dealers", null, superToken, 403);
    const employee = await request("POST", "admin/employees", {name:"Audit Tester",department:"QA",active:true}, superToken, 201);
    await request("POST", "auth/enter", {employeeId:employee.id}, superToken, 201);
    assert.equal((await request("GET","auth/me",null,superToken)).employee_name,"Audit Tester");
    await request("PUT","admin/employees/"+employee.id,{name:"Audit Tester",department:"QA",active:false},superToken);
    await request("GET","admin/dealers",null,superToken,403);
    await request("POST","auth/enter",{employeeId:employee.id},superToken,400);
    await request("POST","auth/enter",{employeeId:null},superToken,201);
    await request("DELETE","admin/employees/"+employee.id,null,superToken);
    const events = await request("GET","admin/activity",null,superToken);
    assert.ok(events.some(e=>e.action==="ENTER_CMS" && e.details.employeeName==="Audit Tester"));
    await request("GET","admin/employees",null,editor,403);
    await request("POST","auth/enter",{employeeId:null},dealer,403);
    check("employee selection, deactivation, retained audit identity and role restrictions");
    await request("GET", "admin/drafts", null, null, 401);
    check("authentication required");
    const registry = await request("GET", "admin/registry", null, superToken);
    assert.equal(registry.length, 20);
    check("20-section registry");
    const draft = async (
      layer,
      ownerId,
      section,
      document,
      expectedRevision = 0,
      token = section === "news" ? editor : superToken,
      removeOverride = false,
    ) =>
      request(
        "POST",
        "admin/drafts",
        { layer, ownerId, section, document, expectedRevision, removeOverride },
        token,
        201,
      );
    const publishBody = (d, target) => ({
      draftIds: d.map((d) => d.id),
      revisions: Object.fromEntries(d.map((d) => [d.id, d.revision])),
      target,
    });
    const publish = async (d, target, token = superToken) => {
      const body = publishBody(d, target);
      const preview = await request(
        "POST",
        "admin/publish/preview",
        body,
        token,
        201,
      );
      return request(
        "POST",
        "admin/publish",
        { ...body, previewHash: preview.previewHash },
        token,
        201,
      );
    };
    const site = async (id) =>
      request(
        "GET",
        "site",
        null,
        null,
        200,
        id === 1 ? "bulltaraautohub.com" : "dealer" + id + ".test",
      );
    const drafts = [];
    for (const [section, document] of Object.entries(defaults))
      drafts.push(await draft("COMMON", 0, section, document));
    assert.equal((await publish(drafts, { mode: "ALL" })).affected, 130);
    check("ALL publishes every section to 130 dealers atomically");
    let news = drafts.find((d) => d.section_key === "news");
    news = await draft(
      "COMMON",
      0,
      "news",
      { ...defaults.news, heading: "Selected update" },
      news.revision,
    );
    assert.notEqual((await site(2)).content.news.heading, "Selected update");
    check("editor news drafts do not change live sites");
    assert.equal(
      (await publish([news], { mode: "SELECTED", dealerIds: [2, 4] })).affected,
      2,
    );
    assert.equal((await site(2)).content.news.heading, "Selected update");
    assert.notEqual((await site(3)).content.news.heading, "Selected update");
    check("SELECTED only updates selected dealers");
    const groupDraft = await draft("GROUP", 1, "news", {
      ...defaults.news,
      heading: "North group",
    });
    assert.equal(
      (await publish([groupDraft], { mode: "GROUP", groupId: 1 })).affected,
      2,
    );
    assert.equal((await site(3)).content.news.heading, "North group");
    assert.equal((await site(4)).content.news.heading, "Selected update");
    check("GROUP membership and precedence");
    const own = await draft(
      "DEALER",
      2,
      "news",
      { ...defaults.news, heading: "Dealer-specific" },
      0,
      dealer,
    );
    await publish([own], { mode: "SINGLE", dealerIds: [2] }, dealer);
    assert.equal((await site(2)).content.news.heading, "Dealer-specific");
    check("SINGLE dealer-specific publishing");
    let override = await draft(
      "OVERRIDE",
      2,
      "news",
      { ...defaults.news, heading: "Explicit override" },
      0,
      dealer,
    );
    await publish([override], { mode: "SINGLE", dealerIds: [2] }, dealer);
    news = await draft(
      "COMMON",
      0,
      "news",
      { ...defaults.news, heading: "New global release" },
      news.revision,
    );
    const pub = await publish([news], { mode: "ALL" });
    assert.equal(pub.preservedOverrides, 1);
    assert.equal((await site(2)).content.news.heading, "Explicit override");
    assert.equal((await site(3)).content.news.heading, "North group");
    assert.equal((await site(4)).content.news.heading, "New global release");
    check(
      "common publishing preserves dealer and group content and explicit overrides",
    );
    override = await draft(
      "OVERRIDE",
      2,
      "news",
      override.document,
      override.revision,
      dealer,
      true,
    );
    await publish([override], { mode: "SINGLE", dealerIds: [2] }, dealer);
    assert.equal((await site(2)).content.news.heading, "Dealer-specific");
    check("explicit override removal restores inheritance");
    await request(
      "POST",
      "admin/drafts",
      {
        layer: "COMMON",
        ownerId: 0,
        section: "news",
        document: defaults.news,
        expectedRevision: news.revision,
      },
      dealer,
      403,
    );
    await request("GET", "admin/dealers/3/resolved", null, dealer, 403);
    await request("GET", "admin/users", null, dealer, 403);
    assert.equal(
      (await request("GET", "admin/dealers", null, dealer)).length,
      1,
    );
    await request(
      "POST",
      "admin/publish/preview",
      publishBody([own], { mode: "ALL" }),
      dealer,
      403,
    );
    await request(
      "POST",
      "admin/publish/preview",
      publishBody([news], { mode: "ALL" }),
      editor,
      403,
    );
    check("dealer isolation and editor publish restrictions");
    await request(
      "POST",
      "admin/drafts",
      {
        layer: "COMMON",
        ownerId: 0,
        section: "news",
        document: defaults.news,
        expectedRevision: 1,
      },
      superToken,
      409,
    );
    const body = publishBody([news], { mode: "ALL" });
    const preview = await request(
      "POST",
      "admin/publish/preview",
      body,
      superToken,
      201,
    );
    news = await draft(
      "COMMON",
      0,
      "news",
      { ...defaults.news, heading: "Next draft" },
      news.revision,
    );
    await request(
      "POST",
      "admin/publish",
      { ...body, previewHash: preview.previewHash },
      superToken,
      409,
    );
    check("stale edits and stale publishing previews rejected");
    await request(
      "POST",
      "admin/publish/preview",
      publishBody([groupDraft], { mode: "SINGLE", dealerIds: [4] }),
      superToken,
      400,
    );
    await request(
      "POST",
      "admin/publish/preview",
      publishBody([news], { mode: "SELECTED", dealerIds: [2, 999] }),
      superToken,
      400,
    );
    check("invalid target sets rejected without partial publication");
    await request("GET", "site", null, null, 404, "unknown.test");
    check("unknown domain cannot read another tenant");
    const enquiry = {
      name: "Test Customer",
      phone: "9999999999",
      email: "customer@test.local",
      address: "Test address",
      district: "Test district",
      product: "Help me choose",
      message: "Integration test enquiry",
      consent: true,
    };
    await request("POST", "enquiries", enquiry, null, 201, "dealer2.test");
    const leads = await request("GET", "admin/enquiries", null, dealer);
    assert.equal(leads.length, 1);
    assert.equal(leads[0].dealer_id, 2);
    await request(
      "PATCH",
      "admin/enquiries/" + leads[0].id,
      { status: "CONTACTED" },
      dealer,
    );
    assert.equal(
      (await request("GET", "admin/enquiries", null, dealer))[0].status,
      "CONTACTED",
    );
    check(
      "contact form persists all six fields and dealer-owned status changes",
    );
    const history = await request("GET", "admin/history", null, dealer);
    assert(
      history.every((p) => p.recipients.length === 1 && p.recipients[0] === 2),
    );
    check("publication history hides other dealer recipients");
    const upload = new FormData();
    upload.append(
      "file",
      new Blob([Buffer.from("89504e470d0a1a0a", "hex")], { type: "image/png" }),
      "test.png",
    );
    const uploaded = await fetch("http://127.0.0.1:3002/api/admin/media", {
      method: "POST",
      headers: { Authorization: "Bearer " + dealer },
      body: upload,
    });
    assert.equal(uploaded.status, 201);
    const media = await uploaded.json();
    assert.match(media.url, /^\/uploads\/[a-f0-9-]+\.png$/);
    const invalid = new FormData();
    invalid.append("file", new Blob(["<script>alert(1)</script>"]), "bad.svg");
    assert.equal(
      (
        await fetch("http://127.0.0.1:3002/api/admin/media", {
          method: "POST",
          headers: { Authorization: "Bearer " + dealer },
          body: invalid,
        })
      ).status,
      400,
    );
    check("media storage and unsupported active-file rejection");

    const dealerBody = {
      name: "Onboarding test",
      location: "Region",
      address: "Address",
      about: "Profile",
      active: false,
      domains: ["new-dealer.test"],
    };
    const created = await request(
      "POST",
      "admin/dealers",
      dealerBody,
      superToken,
      201,
    );
    assert.equal(created.id, 131);
    await request("GET", "site", null, null, 404, "new-dealer.test");
    await request(
      "PUT",
      "admin/dealers/" + created.id,
      { ...dealerBody, active: true },
      superToken,
    );
    const addedSite = await request(
      "GET",
      "site",
      null,
      null,
      200,
      "new-dealer.test",
    );
    assert.equal(addedSite.dealer.id, 131);
    assert.equal(addedSite.content.branding.dealerLogo, "");
    await request("POST", "admin/dealers", dealerBody, superToken, 409);
    await request(
      "PUT",
      "admin/dealers/" + created.id,
      { ...dealerBody, active: true, domains: ["dealer2.test"] },
      superToken,
      409,
    );
    assert.equal(
      (await request("GET", "site", null, null, 200, "new-dealer.test")).dealer
        .id,
      131,
    );
    check(
      "dealer onboarding, activation, unique domains and transactional domain rollback",
    );
    const newGroup = await request(
      "POST",
      "admin/groups",
      { name: "API group", dealerIds: [4, 5] },
      superToken,
      201,
    );
    await request(
      "PUT",
      "admin/groups/" + newGroup.id,
      { name: "API group updated", dealerIds: [5] },
      superToken,
    );
    assert.deepEqual(
      (await request("GET", "admin/groups", null, superToken)).find(
        (g) => g.id === newGroup.id,
      ).dealerIds,
      [5],
    );
    const targetBody = publishBody([news], {
      mode: "GROUP",
      groupId: newGroup.id,
    });
    const groupPreview = await request(
      "POST",
      "admin/publish/preview",
      targetBody,
      superToken,
      201,
    );
    await request(
      "PUT",
      "admin/groups/" + newGroup.id,
      { name: "API group updated", dealerIds: [4, 5] },
      superToken,
    );
    await request(
      "POST",
      "admin/publish",
      { ...targetBody, previewHash: groupPreview.previewHash },
      superToken,
      409,
    );
    check("group CRUD and membership changes invalidate recipient preview");
    const newUser = await request(
      "POST",
      "admin/users",
      {
        name: "New editor",
        email: "neweditor@test.local",
        password,
        role: "EDITOR",
      },
      superToken,
      201,
    );
    const newToken = await login("neweditor@test.local");
    await request(
      "PATCH",
      "admin/users/" + newUser.id,
      { active: false },
      superToken,
    );
    await request("GET", "admin/drafts", null, newToken, 401);
    await request(
      "POST",
      "admin/users",
      {
        name: "Invalid",
        email: "invalid@test.local",
        password,
        role: "SUPER_ADMIN",
      },
      dealer,
      403,
    );
    check("user creation, deactivation and immediate session revocation");
    await request("POST", "auth/logout", {}, dealer, 201);
    await request("GET", "admin/drafts", null, dealer, 401);
    check("logout invalidates the server session");
    fs.writeFileSync(
      "docs/TEST-RESULTS.json",
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          database: (await db.query("SELECT VERSION() AS version"))[0][0].version,
          dealers: 130,
          passed: results,
        },
        null,
        2,
      ),
    );
    console.log("All " + results.length + " integration checks passed.");
  } finally {
    if (server) server.kill();
    await new Promise((r) => setTimeout(r, 300));
    await db.query("DROP DATABASE " + dbName);
    await db.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
