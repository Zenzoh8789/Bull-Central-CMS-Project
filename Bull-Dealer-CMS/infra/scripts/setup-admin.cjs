require("../env.cjs");
const { spawnSync } = require("node:child_process");
const env = {
  ...process.env,
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "admin123",
};
for (const script of ["bootstrap-cms.cjs", "admin-credentials.cjs"]) {
  const result = spawnSync(
    process.execPath,
    [require("node:path").join(__dirname, script)],
    { env, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("Sign in with admin / admin123.");
