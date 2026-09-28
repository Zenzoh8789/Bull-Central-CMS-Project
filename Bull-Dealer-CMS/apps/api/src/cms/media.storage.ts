import { Injectable } from "@nestjs/common";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";

export function mediaConfig(env: NodeJS.ProcessEnv) {
  if (env.MEDIA_STORAGE && env.MEDIA_STORAGE !== "local")
    throw new Error(
      "Only local VPS media storage is supported. Set MEDIA_STORAGE=local.",
    );
  return { driver: "local", dir: resolve(env.MEDIA_DIR || "uploads") };
}

@Injectable()
export class MediaStorage {
  private config = mediaConfig(process.env);
  async put(
    buffer: Buffer,
    extension: string,
    _mime: string,
    _dealerId: number | null,
  ) {
    if (!["png", "jpg", "webp", "pdf"].includes(extension))
      throw new Error("Unsupported media extension");
    const name = randomUUID() + "." + extension;
    await mkdir(this.config.dir, { recursive: true });
    await writeFile(join(this.config.dir, name), buffer, { flag: "wx" });
    return {
      url: "/uploads/" + name,
      discard: () => unlink(join(this.config.dir, name)),
    };
  }
}
