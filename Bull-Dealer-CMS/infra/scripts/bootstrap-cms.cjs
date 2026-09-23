require('../env.cjs');
const fs = require("fs"),
  mysql = require("mysql2/promise");
const { hashPassword } = require("../../apps/api/dist/cms/auth");
(async () => {
  if (!process.env.DATABASE_URL) throw Error("Set DATABASE_URL");
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [users] = await db.query(
      "SELECT id FROM cms_users WHERE role='SUPER_ADMIN' ORDER BY id LIMIT 1",
    );
    let actor = users[0]?.id;
    if (!actor) {
      const password = process.env.ADMIN_PASSWORD,
        email = process.env.ADMIN_EMAIL;
      if (!email || !password || password.length < 8)
        throw Error(
          "Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) for the first CMS administrator",
        );
      const [r] = await db.execute(
        "INSERT INTO cms_users(email,name,password_hash,role,username) VALUES (?,? ,?,'SUPER_ADMIN',?)",
        [
          email,
          "Platform administrator",
          hashPassword(password),
          process.env.ADMIN_USERNAME || "admin",
        ],
      );
      actor = r.insertId;
    }
    const [existing] = await db.query(
      "SELECT id FROM cms_publications LIMIT 1",
    );
    if (existing.length) {
      console.log("CMS already initialized; existing content kept.");
      return;
    }
    const content = JSON.parse(
      fs.readFileSync("infra/tara-content.json", "utf8"),
    );
    const local = [
      "seo",
      "branding",
      "about",
      "dealerContact",
      "locations",
      "social",
      "whatsapp",
      "pageLayout",
      "gallery",
    ];
    await db.beginTransaction();
    const revisions = [];
    for (const [section, document] of Object.entries(content)) {
      const layer = local.includes(section) ? "DEALER" : "COMMON",
        owner = layer === "COMMON" ? 0 : 1;
      const [r] = await db.execute(
        "INSERT INTO cms_drafts(layer,owner_id,section_key,document,updated_by) VALUES (?,?,?,?,?)",
        [layer, owner, section, JSON.stringify(document), actor],
      );
      revisions.push({
        id: r.insertId,
        layer,
        owner,
        section,
        revision: 1,
        document,
      });
    }
    const [pub] = await db.execute(
      "INSERT INTO cms_publications(actor_id,target,revisions,recipients) VALUES (?,?,?,?)",
      [
        actor,
        JSON.stringify({ mode: "SINGLE", dealerIds: [1] }),
        JSON.stringify(revisions),
        "[1]",
      ],
    );
    for (const r of revisions)
      await db.execute(
        "INSERT INTO cms_live(dealer_id,layer,section_key,source_owner,revision,document,publication_id) VALUES (1,?,?,?,?,?,?)",
        [
          r.layer,
          r.section,
          r.owner,
          1,
          JSON.stringify(r.document),
          pub.insertId,
        ],
      );
    await db.commit();
    console.log("Initialized all 20 CMS sections and Tara website.");
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    await db.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
