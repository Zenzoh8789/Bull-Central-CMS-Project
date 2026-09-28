require('../env.cjs');
const mysql = require('mysql2/promise');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { CmsService } = require('../../apps/api/dist/cms/cms.service');
(async () => {
  if (!process.env.TEST_DATABASE_URL) throw Error('Set TEST_DATABASE_URL to a disposable test server');
  const url = new URL(process.env.TEST_DATABASE_URL);
  const name = 'bull_username_test_' + Date.now();
  const db = await mysql.createConnection(url.toString());
  url.pathname = '/' + name;
  const env = { ...process.env, DATABASE_URL: url.toString(), ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'admin123', ADMIN_EMAIL: '' };
  const run = script => execFileSync(process.execPath, ['infra/scripts/' + script + '.cjs'], { env, windowsHide: true, stdio: 'pipe' });
  let pool;
  try {
    await db.query('CREATE DATABASE ' + name);
    await db.query('USE ' + name);
    run('migrate');
    // Reproduce the old required-email schema, then verify upgrade support.
    await db.query('ALTER TABLE cms_users MODIFY email VARCHAR(150) NOT NULL');
    run('migrate');
    run('bootstrap-cms');
    const [[user]] = await db.query('SELECT * FROM cms_users');
    assert.equal(user.username, 'admin');
    assert.equal(user.email, null);
    pool = mysql.createPool(url.toString());
    const service = new CmsService({ pool });
    const session = await service.login({ username: 'admin', password: 'admin123' });
    assert.ok(session.token);
    run('bootstrap-cms');
    const [[count]] = await db.query('SELECT COUNT(*) AS total FROM cms_users');
    assert.equal(count.total, 1);
    run('admin-credentials');
    assert.ok((await service.login({ username: 'admin', password: 'admin123' })).token);
    console.log('PASS: migrate old email schema, bootstrap without email, admin/admin123 login, idempotent bootstrap and username-only credentials reset.');
  } finally {
    if (pool) await pool.end();
    await db.query('DROP DATABASE ' + name);
    await db.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
