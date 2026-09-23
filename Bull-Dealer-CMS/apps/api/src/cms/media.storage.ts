import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
export function mediaConfig(env: NodeJS.ProcessEnv) {
  const driver = env.MEDIA_STORAGE || "local";
  if (!["local", "r2"].includes(driver))
    throw new Error("MEDIA_STORAGE must be local or r2");
  if (driver === "local")
    return { driver, dir: resolve(env.MEDIA_DIR || "uploads") };
  for (const name of [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_PUBLIC_URL",
  ])
    if (!env[name]) throw new Error(name + " is required for R2 storage");
  if (!/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID!))
    throw new Error("Invalid R2 account identifier");
  const publicUrl = new URL(env.R2_PUBLIC_URL!);
  if (
    publicUrl.protocol !== "https:" ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.search ||
    publicUrl.hash
  )
    throw new Error(
      "R2_PUBLIC_URL must be an HTTPS public bucket domain without credentials or query",
    );
  return {
    driver,
    bucket: env.R2_BUCKET!,
    publicUrl: publicUrl.href.replace(/\/$/, ""),
    endpoint: "https://" + env.R2_ACCOUNT_ID + ".r2.cloudflarestorage.com",
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  };
}
@Injectable()
export class MediaStorage {
  private config = mediaConfig(process.env);
  private client =
    this.config.driver === "r2"
      ? new S3Client({
          region: "auto",
          endpoint: this.config.endpoint,
          credentials: {
            accessKeyId: this.config.accessKeyId!,
            secretAccessKey: this.config.secretAccessKey!,
          },
        })
      : null;
  async put(
    buffer: Buffer,
    extension: string,
    mime: string,
    dealerId: number | null,
  ) {
    const name = randomUUID() + "." + extension;
    if (!this.client) {
      await mkdir(this.config.dir!, { recursive: true });
      await writeFile(join(this.config.dir!, name), buffer, { flag: "wx" });
      return {
        url: "/uploads/" + name,
        discard: () => unlink(join(this.config.dir!, name)),
      };
    }
    const key = (dealerId ? "dealers/" + dealerId : "common") + "/" + name;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: buffer,
          ContentType: mime,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    } catch {
      throw new ServiceUnavailableException(
        "Media storage unavailable. Please retry.",
      );
    }
    return {
      url: this.config.publicUrl + "/" + key,
      discard: () =>
        this.client!.send(
          new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
        ),
    };
  }
}
