require('../env.cjs');
const fs = require("fs"),
  mysql = require("mysql2/promise");
(async () => {
  if (!process.env.DATABASE_URL)
    throw Error("Set DATABASE_URL to an existing MySQL database");
  const db = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
  });
  let locked = false;
  try {
    const [[row]] = await db.query(
      "SELECT GET_LOCK(CONCAT(DATABASE(),':cms-migration'),30) AS acquired",
    );
    if (row.acquired !== 1) throw Error("Could not lock database migrations");
    locked = true;
    const hasTable = async (table) => {
      const [r] = await db.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",
        [table],
      );
      return r.length > 0;
    };
    if (!(await hasTable("dealers")))
      await db.query(fs.readFileSync("infra/init.sql", "utf8"));
    else {
      const [columns] = await db.query("SHOW COLUMNS FROM products");
      const present = new Set(columns.map((c) => c.Field));
      for (const [name, type] of [
        ["menu_label", "VARCHAR(100) NOT NULL DEFAULT ''"],
        ["menu_image", "VARCHAR(500) NOT NULL DEFAULT ''"],
        ["show_in_menu", "BOOLEAN NOT NULL DEFAULT FALSE"],
        ["menu_order", "INT NOT NULL DEFAULT 0"],
      ])
        if (!present.has(name))
          await db.query(
            "ALTER TABLE products ADD COLUMN " + name + " " + type,
          );
    }
    const sql = fs.readFileSync("infra/migrations/003_central_cms.sql", "utf8");
    await db.query(sql.slice(0, sql.indexOf("ALTER TABLE enquiries")));
    const [userColumns] = await db.query("SHOW COLUMNS FROM cms_users");
    if (userColumns.some(c => c.Field === "email" && c.Null === "NO"))
      await db.query("ALTER TABLE cms_users MODIFY email VARCHAR(150) NULL");
    if (!userColumns.some((c) => c.Field === "username"))
      await db.query(
        "ALTER TABLE cms_users ADD COLUMN username VARCHAR(80) NULL UNIQUE",
      );
    await db.query(
      "UPDATE cms_users SET username=CONCAT('user-',id) WHERE username IS NULL",
    );
    const [columns] = await db.query("SHOW COLUMNS FROM enquiries");
    const present = new Set(columns.map((c) => c.Field));
    for (const [name, type] of [
      ["address", "VARCHAR(1000) NOT NULL DEFAULT ''"],
      ["district", "VARCHAR(150) NOT NULL DEFAULT ''"],
      ["status", "ENUM('NEW','CONTACTED','CLOSED') NOT NULL DEFAULT 'NEW'"],
    ])
      if (!present.has(name))
        await db.query("ALTER TABLE enquiries ADD COLUMN " + name + " " + type);
    await db.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(version VARCHAR(40) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    );
    await db.execute(
      "INSERT IGNORE INTO schema_migrations(version) VALUES (?)",
      ["003_central_cms"],
    );
    console.log("CMS schema is up to date. Existing content was preserved.");
  } finally {
    if (locked)
      await db.query(
        "SELECT RELEASE_LOCK(CONCAT(DATABASE(),':cms-migration'))",
      );
    await db.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
