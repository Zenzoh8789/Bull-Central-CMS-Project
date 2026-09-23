import test from "node:test";
import assert from "node:assert/strict";
import { mediaConfig } from "./cms/media.storage";
test("media configuration defaults to local and requires complete R2 credentials", () => {
  assert.equal(mediaConfig({}).driver, "local");
  assert.throws(() => mediaConfig({ MEDIA_STORAGE: "other" }));
  assert.throws(() => mediaConfig({ MEDIA_STORAGE: "r2" }));
  const env = {
    MEDIA_STORAGE: "r2",
    R2_ACCOUNT_ID: "a".repeat(32),
    R2_ACCESS_KEY_ID: "test",
    R2_SECRET_ACCESS_KEY: "test",
    R2_BUCKET: "media",
    R2_PUBLIC_URL: "https://media.example.com/",
  };
  const config = mediaConfig(env);
  assert.equal(
    config.endpoint,
    "https://" + "a".repeat(32) + ".r2.cloudflarestorage.com",
  );
  assert.equal(config.publicUrl, "https://media.example.com");
  assert.throws(() =>
    mediaConfig({ ...env, R2_PUBLIC_URL: "http://media.example.com" }),
  );
});
