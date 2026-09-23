require('../env.cjs');
const assert = require('node:assert/strict');
(async () => {
  const request = async (base, route, expected, options = {}) => {
    const response = await new Promise((resolve, reject) => {
      const req = require('node:http').request(base + '/api/' + route, options, res => {
        let data=''; res.on('data', chunk => data += chunk);
        res.on('end', () => { try { resolve({status:res.statusCode, json:() => JSON.parse(data)}); } catch(error) {reject(error);} });
      });
      req.on('error',reject);
      if(options.body) req.write(options.body);
      req.end();
    });
    assert.equal(response.status, expected, `${base}/api/${route}`);
    return response.json();
  };
  const api='http://localhost:3000', admin='http://localhost:5174', web='http://localhost:5173';
  assert.equal((await request(api,'health',200)).mode,'mysql');
  for (const host of ['localhost:5173','127.0.0.1:5173','[::1]:5173','BULLTARAAUTOHUB.COM:5173']) {
    const site=await request(api,'site',200,{headers:{host}});
    assert.equal(site.mode,'mysql');
    assert.ok(site.dealer.active);
    assert.ok(site.content.banners);
  }
  await request(api,'site',404,{headers:{host:'unregistered.invalid'}});
  assert.ok((await request(web,'site',200)).content.branding);
  await request(admin,'admin/dashboard',401);
  const login = password => ({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:process.env.ADMIN_USERNAME || 'admin',password})});
  await request(admin,'auth/login',401,login('incorrect-local-smoke-password'));
  if (!process.env.ADMIN_PASSWORD) throw Error('Set ADMIN_PASSWORD to the existing administrator password for this test.');
  const session=await request(admin,'auth/login',201,login(process.env.ADMIN_PASSWORD));
  assert.ok(session.token);
  assert.equal('password_hash' in session.user,false);
  const headers={authorization:'Bearer '+session.token};
  await request(admin,'auth/me',200,{headers});
  await request(admin,'admin/dashboard',200,{headers});
  await request(admin,'auth/logout',201,{method:'POST',headers});
  await request(admin,'auth/me',401,{headers});
  console.log('PASS: API health, four host forms, unknown-host 404, dealer Vite proxy, admin Vite proxy, bad password 401, login, protected dashboard, logout/session revocation.');
})().catch(error => { console.error(error.message); process.exit(1); });
