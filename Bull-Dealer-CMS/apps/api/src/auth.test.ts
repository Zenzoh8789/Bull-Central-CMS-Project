import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './cms/auth';
import { CmsService } from './cms/cms.service';

test('password verification rejects malformed stored hashes without throwing', () => {
  for (const hash of ['', 'legacy-hash', ':', 'salt:00', null, undefined])
    assert.equal(verifyPassword('password', hash as any), false);
  const hash = hashPassword('a valid password');
  assert.equal(verifyPassword('a valid password', hash), true);
  assert.equal(verifyPassword('wrong password', hash), false);
});

test('login preserves password whitespace and returns no stored hash', async () => {
  const password = '  significant spaces  ';
  const user = { id: 1, username: 'admin', password_hash: hashPassword(password) };
  const service = new CmsService({ pool: { execute: async (sql: string) =>
    sql.startsWith('SELECT') ? [[user]] : [{}] } } as any);
  const result = await service.login({ username: 'admin', password });
  assert.ok(result.token);
  assert.equal('password_hash' in result.user, false);
  await assert.rejects(service.login({ username: 'admin', password: password.trim() }), /Invalid username or password/);
});
