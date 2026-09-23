import defaults from "@bull/content";
import { BadRequestException } from "@nestjs/common";
export const sectionKeys = Object.keys(defaults);
export const dealerSections = [
  "seo",
  "branding",
  "about",
  "dealerContact",
  "locations",
  "social",
  "whatsapp",
  "pageLayout",
  "gallery",
];
export function registry() {
  return sectionKeys.map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    preferredScope: dealerSections.includes(key) ? "DEALER" : "COMMON",
    defaultValue: defaults[key],
  }));
}
export function validateSection(key: string, value: unknown) {
  if (!sectionKeys.includes(key))
    throw new BadRequestException("Unknown CMS section");
  const visit = (template: any, item: any, path: string, depth = 0) => {
    if (depth > 12)
      throw new BadRequestException("Content nesting is too deep");
    if (Array.isArray(template)) {
      if (!Array.isArray(item) || item.length > 150)
        throw new BadRequestException(
          `${path}: expected a list of up to 150 items`,
        );
      item.forEach((v, i) => visit(template[0], v, `${path}[${i}]`, depth + 1));
      return;
    }
    if (template && typeof template === "object") {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw new BadRequestException(`${path}: expected an object`);
      for (const name of Object.keys(item))
        if (!Object.hasOwn(template, name))
          throw new BadRequestException(`${path}: unknown field ${name}`);
      for (const name of Object.keys(template))
        visit(template[name], item[name], `${path}.${name}`, depth + 1);
      return;
    }
    if (typeof item !== typeof template)
      throw new BadRequestException(`${path}: invalid value type`);
    if (
      typeof item === "number" &&
      (!Number.isFinite(item) || item < 0 || item > 1000000)
    )
      throw new BadRequestException(`${path}: invalid number`);
    if (typeof item === "string") {
      if (item.length > 20000)
        throw new BadRequestException(`${path}: text is too long`);
      const field = path.split(".").pop()!;
      if (
        /url$|image$|logo$|banner$|favicon$|background$|canonical$/i.test(
          field,
        ) &&
        item
      ) {
        if (!/^\/(?!\/)[^\\]*$/.test(item) && !/^https:\/\//i.test(item))
          throw new BadRequestException(
            `${path}: use a local path or HTTPS URL`,
          );
        if (item.includes("\\") || /[\u0000-\u001f]/.test(item))
          throw new BadRequestException(`${path}: invalid URL`);
        if (/^https:/i.test(item)) {
          let u: URL;
          try {
            u = new URL(item);
          } catch {
            throw new BadRequestException(`${path}: invalid URL`);
          }
          if (u.username || u.password)
            throw new BadRequestException(
              `${path}: URL credentials are not allowed`,
            );
        }
      }
      if (field === "mapUrl" && item) {
        let u: URL;
        try {
          u = new URL(item);
        } catch {
          throw new BadRequestException("Invalid map URL");
        }
        if (
          !["www.google.com", "maps.google.com"].includes(u.hostname) ||
          !u.pathname.startsWith("/maps")
        )
          throw new BadRequestException(
            "Maps must use a Google Maps embed URL",
          );
      }
      if (field === "videoId" && !/^[A-Za-z0-9_-]{11}$/.test(item))
        throw new BadRequestException("Invalid YouTube video ID");
    }
  };
  visit(defaults[key], value, key);
  const doc = value as any;
  if (key === "products") {
    if (
      doc.items.some(
        (p: any) => !p.name.trim() || p.name.length > 100 || p.id.length > 40,
      )
    )
      throw new BadRequestException(
        "Product names must be 1–100 characters and IDs at most 40",
      );
    const ids = doc.items.map((p: any) => p.id);
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id: string) => !/^[-a-z0-9]+$/.test(id))
    )
      throw new BadRequestException(
        "Product IDs must be unique URL-safe identifiers",
      );
  }
  if (key === "contact") {
    const expected = [
      "name",
      "phone",
      "email",
      "address",
      "district",
      "message",
    ];
    if (
      doc.fields.length !== 6 ||
      new Set(doc.fields.map((f: any) => f.name)).size !== 6 ||
      doc.fields.some((f: any) => !expected.includes(f.name))
    )
      throw new BadRequestException("Keep all six original enquiry fields");
  }
  if (key === "pageLayout") {
    const allowed = defaults.pageLayout.sections.map((s: any) => s.key);
    if (
      doc.sections.length !== allowed.length ||
      new Set(doc.sections.map((s: any) => s.key)).size !== allowed.length ||
      doc.sections.some((s: any) => !allowed.includes(s.key))
    )
      throw new BadRequestException(
        "Keep each website section once; use visibility to hide sections",
      );
  }
  if (key === "banners" && doc.interval < 2000)
    throw new BadRequestException(
      "Slideshow interval must be at least 2000 ms",
    );
  return value;
}
export function resolveContent(rows: any[]) {
  const result = structuredClone(defaults);
  const sources: Record<string, string> = {};
  const ranks = ["COMMON", "GROUP", "DEALER", "OVERRIDE"];
  for (const layer of ranks)
    for (const row of rows.filter((r) => r.layer === layer)) {
      result[row.section_key] =
        typeof row.document === "string"
          ? JSON.parse(row.document)
          : row.document;
      sources[row.section_key] = layer;
    }
  return { content: result, sources };
}
