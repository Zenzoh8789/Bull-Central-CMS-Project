const { randomBytes, scryptSync } = require("node:crypto");

const password = process.argv[2];

if (!password || password.length < 12) {
  console.error("Password must be at least 12 characters");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

console.log(hash);
