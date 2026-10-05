import test from "node:test";
import assert from "node:assert/strict";
import { CmsService } from "./cms/cms.service";
const actor: any = { id: 1, name: "Admin", role: "SUPER_ADMIN" };
const body = {
  name: "Dealer",
  location: "Bihar",
  address: "Patna",
  about: "Dealer service",
  active: true,
  domains: ["dealer.example.com"],
};
function mock() {
  const calls: any[] = [];
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql: string, args: any[]) => {
      calls.push({ sql, args });
      return [{ affectedRows: 1 }];
    },
  };
  const service: any = Object.create(CmsService.prototype);
  service.repo = { pool: { getConnection: async () => connection } };
  service.audit = async () => {};
  return { service, calls };
}
test("dealer geography updates use parameters and trim explicit state and district", async () => {
  const { service, calls } = mock();
  await service.saveDealer(
    actor,
    { ...body, state: " Bihar ", district: " Patna " },
    1,
  );
  const update = calls.find((c) => c.sql.startsWith("UPDATE dealers"));
  assert.match(update.sql, /state=COALESCE\(\?,state\)/);
  assert.deepEqual(update.args.slice(-3), ["Bihar", "Patna", 1]);
});
test("older dealer updates preserve geography when new fields are absent", async () => {
  const { service, calls } = mock();
  await service.saveDealer(actor, body, 1);
  assert.deepEqual(calls[0].args.slice(-3), [null, null, 1]);
});
test("invalid district types are rejected before database writes", async () => {
  const { service, calls } = mock();
  await assert.rejects(() =>
    service.saveDealer(actor, { ...body, district: 42 }, 1),
  );
  assert.equal(calls.length, 0);
});
