require('../env.cjs');
const mysql = require("mysql2/promise");
const { hashPassword } = require("../../apps/api/dist/cms/auth");
(async () => {
  const username = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!/^[a-z0-9_.-]{3,80}$/.test(username))
    throw Error(
      "Set ADMIN_USERNAME: 3–80 letters, numbers, dots, underscores or hyphens.",
    );
  if (password.length < 8)
    throw Error("Set ADMIN_PASSWORD with at least 8 characters.");
  if (!process.env.DATABASE_URL)
    throw Error("Set DATABASE_URL and run npm run db:migrate first.");
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await db.beginTransaction();
    const email = process.env.ADMIN_EMAIL;
    const [rows] = await db.execute(
      "SELECT id FROM cms_users WHERE role='SUPER_ADMIN' AND active=1" +
        (email ? " AND email=?" : "") +
        " FOR UPDATE",
      email ? [email] : [],
    );
    if (rows.length !== 1)
      throw Error(
        "Set ADMIN_EMAIL to select exactly one existing active super administrator.",
      );
    await db.execute(
      "UPDATE cms_users SET username=?, password_hash=? WHERE id=?",
      [username, hashPassword(password), rows[0].id],
    );
    await db.execute("DELETE FROM cms_sessions WHERE user_id=?", [rows[0].id]);
    await db.execute(
      "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
      [rows[0].id, "ADMIN_CREDENTIALS_CHANGED", JSON.stringify({ username })],
    );
    await db.commit();
    console.log(
      "Admin username/password updated. Previous sessions were signed out. Contact email was preserved.",
    );
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
