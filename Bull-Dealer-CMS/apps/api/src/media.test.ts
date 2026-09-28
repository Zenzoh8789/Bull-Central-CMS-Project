import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mediaConfig, MediaStorage } from "./cms/media.storage";

test("media uses VPS storage and rejects unsupported drivers", () => {
  assert.equal(mediaConfig({}).driver, "local");
  assert.throws(() => mediaConfig({ MEDIA_STORAGE: "r2" }));
  assert.throws(() => mediaConfig({ MEDIA_STORAGE: "other" }));
});

test("local uploads persist unique files and can roll back failed database inserts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bull-media-test-"));
  const storage = new MediaStorage();
  (storage as any).config = { driver: "local", dir };
  try {
    const bytes = Buffer.from("test image content");
    const first = await storage.put(bytes, "png", "image/png", null);
    const second = await storage.put(bytes, "png", "image/png", 2);
    assert.notEqual(first.url, second.url);
    assert.match(first.url, /^\/uploads\/[a-f0-9-]+\.png$/);
    const path = join(dir, first.url.split("/").pop()!);
    assert.deepEqual(await readFile(path), bytes);
    await first.discard();
    await assert.rejects(readFile(path));
    await assert.rejects(storage.put(bytes, "../html", "text/html", null));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
