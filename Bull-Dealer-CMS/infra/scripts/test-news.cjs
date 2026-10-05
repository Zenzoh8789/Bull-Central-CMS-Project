require('../env.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../../apps/api/dist/cms/auth');
const { normalizeNews, supportsNewsArticles } = require('@bull/content/news');
const legacy = require('../tara-content.json').news;
const defaults = require('@bull/content');
(async () => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a disposable-test MySQL server.');
  const url = new URL(process.env.TEST_DATABASE_URL);
  const name = 'bull_news_test_' + Date.now();
  assert.match(name, /^bull_news_test_\d+$/);
  const db = await mysql.createConnection({ uri: url.toString(), multipleStatements: true });
  url.pathname = '/' + name;
  const port = Number(process.env.NEWS_TEST_PORT || 3008);
  const base = 'http://127.0.0.1:' + port;
  const directory = path.resolve('.local', name);
  fs.mkdirSync(directory, { recursive: true });
  const results = [];
  const check = label => { results.push(label); console.log('PASS ' + label); };
  let server;
  const stop = async () => { if (server && server.exitCode === null) { const done = once(server, 'exit'); server.kill(); await done; } };
  const start = async () => {
    const log = fs.openSync(path.join(directory, 'api.log'), 'a');
    server = spawn(process.execPath, ['apps/api/dist/main.js'], {
      cwd: process.cwd(), windowsHide: true, stdio: ['ignore', log, log],
      env: { ...process.env, DATABASE_URL: url.toString(), DEMO_MODE: 'false', PORT: String(port), MEDIA_STORAGE: 'local', MEDIA_DIR: path.join(directory, 'uploads') },
    });
    fs.closeSync(log);
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error('Test API failed; see ' + directory);
      try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error('Test API startup timed out');
  };
  const request = async (method, endpoint, body, token, status = 200, host) => {
    const { status: actual, data } = await new Promise((resolve, reject) => {
      const req = require('node:http').request(base + '/api/' + endpoint, {
        method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(host ? { Host: host } : {}) },
      }, res => {
        let text = ''; res.on('data', chunk => text += chunk);
        res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(text) }); } catch (e) { reject(e); } });
      });
      req.on('error', reject);
      req.end(body ? JSON.stringify(body) : undefined);
    });
    assert.equal(actual, status, method + ' ' + endpoint + ': ' + JSON.stringify(data));
    return data;
  };
  try {
    await db.query('CREATE DATABASE ' + name + ' CHARACTER SET utf8mb4');
    await db.query('USE ' + name);
    await db.query(fs.readFileSync('infra/init.sql', 'utf8'));
    await db.query(fs.readFileSync('infra/migrations/003_central_cms.sql', 'utf8'));
    await db.query(fs.readFileSync('infra/migrations/004_employees.sql','utf8'));
    await db.query("ALTER TABLE dealers ADD COLUMN state VARCHAR(100) NOT NULL DEFAULT '', ADD COLUMN district VARCHAR(100) NOT NULL DEFAULT ''");
    await db.query('ALTER TABLE cms_sessions ADD COLUMN employee_id INT NULL, ADD COLUMN cms_entered BOOLEAN NOT NULL DEFAULT FALSE');

    for (const id of [2, 3]) {
      await db.execute('INSERT INTO dealers(id,name,location,address,about,active) VALUES (?,?,?,?,?,1)', [id, 'QA Dealer ' + id, 'Test', 'Test', 'Test']);
      await db.execute('INSERT INTO dealer_domains VALUES (?,?)', ['dealer' + id + '.test', id]);
    }
    const password = require('node:crypto').randomBytes(18).toString('hex');
    for (const [id, role, dealer] of [[1, 'SUPER_ADMIN', null], [2, 'EDITOR', null], [3, 'DEALER_ADMIN', 2]])
      await db.execute('INSERT INTO cms_users(id,email,username,name,password_hash,role,dealer_id) VALUES (?,?,?,?,?,?,?)', [id, role + '@test.local', role.toLowerCase(), role, hashPassword(password), role, dealer]);
    // Seed the exact older COMMON document, as stored before the new editor.
    await db.execute("INSERT INTO cms_drafts(layer,owner_id,section_key,document,updated_by) VALUES ('COMMON',0,'news',?,1)", [JSON.stringify(legacy)]);
    await db.execute("INSERT INTO cms_publications(actor_id,target,revisions,recipients) VALUES (1,'{}','[]','[1,2,3]')");
    for (const id of [1, 2, 3])
      await db.execute("INSERT INTO cms_live VALUES (?,'COMMON','news',0,1,?,1)", [id, JSON.stringify(legacy)]);
    await start();
    const sessions = {};
    for (const role of ['SUPER_ADMIN', 'EDITOR', 'DEALER_ADMIN'])
      sessions[role] = await request('POST', 'auth/login', { username: role.toLowerCase(), password }, null, 201);
    const admin = sessions.SUPER_ADMIN.token, editor = sessions.EDITOR.token, dealer = sessions.DEALER_ADMIN.token;
    await request('POST','auth/enter',{employeeId:null},admin,201);
    const site = id => request('GET', 'site', null, null, 200, id === 1 ? 'bulltaraautohub.com' : 'dealer' + id + '.test');
    const save = (layer, ownerId, document, revision, token = admin, removeOverride = false) => request('POST', 'admin/drafts', { layer, ownerId, section: 'news', document, expectedRevision: revision, removeOverride }, token, 201);
    const approve = async (draft, token = admin, target = { mode: 'ALL' }) => {
      const body = { draftIds: [draft.id], revisions: { [draft.id]: draft.revision }, target };
      const preview = await request('POST', 'admin/publish/preview', body, token, 201);
      return request('POST', 'admin/publish', { ...body, previewHash: preview.previewHash }, token, 201);
    };
    const registry = await request('GET', 'admin/registry', null, admin);
    assert.equal(supportsNewsArticles(registry.find(x => x.key === 'news')), true);
    let common = (await request('GET', 'admin/drafts', null, admin))[0];
    assert.deepEqual(common.document, normalizeNews(legacy));
    assert.deepEqual((await site(1)).content.news, normalizeNews(legacy));
    const [[raw]] = await db.query("SELECT document FROM cms_drafts WHERE id=1");
    assert.deepEqual(typeof raw.document === 'string' ? JSON.parse(raw.document) : raw.document, legacy);
    check('Legacy COMMON articles normalize on read without mutating stored data; API capability is ready');
    common = await save('COMMON', 0, common.document, common.revision);
    assert.equal(common.published, true);
    assert.equal(common.document.items.length, 0);
    check('Legacy seeded external stories are removed; new articles use local blog content');
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=', 'base64');
    const form = new FormData(); form.append('file', new Blob([image], { type: 'image/png' }), 'news.png');
    const uploaded = await fetch(base + '/api/admin/media', { method: 'POST', headers: { Authorization: 'Bearer ' + admin }, body: form });
    assert.equal(uploaded.status, 201);
    const media = await uploaded.json();
    assert.equal(media.mime, 'image/png');
    assert.deepEqual(Buffer.from(await (await fetch(base + media.url)).arrayBuffer()), image);
    check('Real multipart image upload persists and is publicly readable');
    const article = { slug: 'qa-news', title: 'QA saved article', date: '2026-09-23', category: 'Company Updates', image: media.url, body: 'First paragraph.\n\nSecond paragraph — தமிழ்.' };
    common = await save('COMMON', 0, { ...common.document, items: [...common.document.items, article] }, common.revision);
    assert.equal(common.published, true);
    for (const id of [1, 2, 3]) assert.deepEqual((await site(id)).content.news, common.document);
    assert.deepEqual((await site(1)).content.branding, defaults.branding);
    check('Administrator COMMON save publishes image/content to all dealers and preserves unrelated sections');
    await stop(); await start();
    const reloaded = (await request('GET', 'admin/drafts', null, admin)).find(x => x.id === common.id);
    assert.deepEqual(reloaded.document, common.document);
    assert.deepEqual((await site(1)).content.news, common.document);
    assert.equal((await fetch(base + media.url)).status, 200);
    check('Draft, public content and uploaded image survive an actual API process restart');
    let own = await save('DEALER', 2, { ...common.document, items: [{ ...article, title: 'Dealer only' }] }, 0, dealer);
    assert.equal(own.published, true);
    assert.deepEqual((await site(2)).content.news, own.document);
    assert.deepEqual((await site(3)).content.news, common.document);
    common = await save('COMMON', 0, { ...common.document, heading: 'New COMMON heading' }, common.revision);
    assert.deepEqual((await site(2)).content.news, own.document);
    assert.deepEqual((await site(3)).content.news, common.document);
    check('DEALER save affects only its owner; later COMMON publication preserves higher-priority dealer content');
    const liveBefore = (await site(3)).content.news;
    common = await save('COMMON', 0, { ...common.document, items: common.document.items.map(x => x.slug === article.slug ? { ...x, body: 'Editor revised content' } : x) }, common.revision, editor);
    assert.equal(common.published, false);
    assert.deepEqual((await site(3)).content.news, liveBefore);
    await request('POST', 'admin/publish/preview', { draftIds: [common.id], revisions: { [common.id]: common.revision }, target: { mode: 'ALL' } }, editor, 403);
    await request('POST', 'admin/publish', { draftIds: [common.id], target: { mode: 'ALL' } }, editor, 403);
    await approve(common);
    assert.deepEqual((await site(3)).content.news, common.document);
    assert.deepEqual((await site(2)).content.news, own.document);
    check('Editor saves remain drafts; preview/publish are forbidden; administrator approval publishes the saved revision');
    await request('POST', 'admin/drafts', { layer: 'COMMON', ownerId: 0, section: 'news', document: common.document, expectedRevision: common.revision }, dealer, 403);
    await request('POST', 'admin/drafts', { layer: 'DEALER', ownerId: 3, section: 'news', document: common.document, expectedRevision: 0 }, dealer, 403);
    await request('POST', 'admin/drafts', { layer: 'COMMON', ownerId: 0, section: 'news', document: common.document, expectedRevision: 1 }, admin, 409);
    check('Dealer boundaries and stale draft revision protection remain enforced');
    let override = await save('OVERRIDE', 2, { ...own.document, heading: 'Explicit override' }, 0, dealer);
    assert.equal((await site(2)).content.news.heading, 'Explicit override');
    override = await save('OVERRIDE', 2, override.document, override.revision, dealer, true);
    assert.equal(override.published, true);
    assert.deepEqual((await site(2)).content.news, own.document);
    own = await save('DEALER', 2, { ...own.document, items: [] }, own.revision, dealer);
    assert.deepEqual((await site(2)).content.news.items, []);
    check('Explicit override removal restores inheritance; removing an article persists');
    // Direct approval of a legacy draft must use the same migration as editing.
    await db.execute('UPDATE cms_drafts SET document=?,revision=revision+1 WHERE id=?', [JSON.stringify(legacy), common.id]);
    common = (await request('GET', 'admin/drafts', null, admin)).find(x => x.id === common.id);
    await approve(common);
    assert.deepEqual((await site(3)).content.news, normalizeNews(legacy));
    check('Administrator can approve an untouched legacy draft through the normal publish workflow');
    common = await save('COMMON', 0, { ...common.document, bannerImage: media.url }, common.revision);
    assert.equal((await site(1)).content.news.bannerImage, media.url);
    check('Independent News banner upload saves and publishes without changing article images');
    await request('DELETE', 'admin/dealers/3', null, dealer, 403);
    await request('DELETE', 'admin/dealers/3', null, admin);
    assert.equal((await request('GET', 'admin/dealers', null, admin)).some(d => d.id === 3), false);
    await request('GET', 'site', null, null, 404, 'dealer3.test');
    await request('DELETE', 'admin/dealers/3', null, admin, 404);
    assert.equal((await site(2)).dealer.id, 2);
    check('Dealer deletion is administrator-only, removes tenant resolution and leaves other dealers intact');
    const [[version]] = await db.query('SELECT VERSION() AS version');
    fs.writeFileSync('NEWS-FIX-VERIFICATION.json', JSON.stringify({ timestamp: new Date().toISOString(), database: version.version, passed: results }, null, 2));
    if (process.env.NEWS_QA_KEEP === 'true') {
      fs.writeFileSync(path.join(directory, 'browser-session.json'), JSON.stringify({ base, sessions, database: name, password }));
      console.log('Browser QA ready: ' + directory);
      await new Promise(resolve => process.once('SIGINT', resolve));
    }
  } finally {
    await stop();
    await db.query('DROP DATABASE ' + name);
    await db.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
