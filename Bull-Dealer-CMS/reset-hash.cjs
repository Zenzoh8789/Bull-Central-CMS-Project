const crypto = require("crypto");

const password = process.argv[2];
if (!password) {
  console.error("Password missing");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = salt + ":" + crypto.scryptSync(password, salt, 64).toString("hex");

process.stdout.write(hash);
