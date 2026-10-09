import {
  bannerTemplate,
  indianStates,
  normalizeBanners,
} from "@bull/content/banners";
import { normalizeEditorSection } from "@bull/content/editing";
import {
  newsTemplate,
  newsCapabilities,
  normalizeNews,
} from "@bull/content/news";
import defaults from "@bull/content";
import { BadRequestException } from "@nestjs/common";

export const sectionKeys = Object.keys(defaults);

export const contactSections = ["dealerContact", "locations", "social", "deliveryMedia"];
const deliveryMediaTemplate = { ...defaults.deliveryMedia, items: [{"type":"photo","title":"","district":"","state":"","image":"","alt":"","videoId":""}] };
const contactTemplate = { ...defaults.contact, bannerAlt: defaults.contact.bannerAlt || "Contact Us" };

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
  "deliveryMedia",
];

const bannerValidationTemplate = bannerTemplate;
const productValidationTemplate = normalizeEditorSection("products", defaults.products);

export function registry() {
  return sectionKeys.map((key) => ({
    key,

    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),

    preferredScope: dealerSections.includes(key) ? "DEALER" : "COMMON",

    defaultValue: key === "contact" ? contactTemplate : key === "locations" ? { ...defaults.locations, items: [defaults.locations.items[0]] } : defaults[key],

    template:
      key === "news"
        ? newsTemplate
        : key === "banners"
          ? bannerValidationTemplate
          : key === "deliveryMedia" ? deliveryMediaTemplate : key === "contact" ? contactTemplate : key === "products" ? productValidationTemplate : defaults[key],

    ...(key === "news" ? { capabilities: newsCapabilities } : {}),
  }));
}

export function validateSection(key: string, value: unknown) {
  if (!sectionKeys.includes(key)) {
    throw new BadRequestException("Unknown CMS section");
  }

  if (key === "news") {
    value = normalizeNews(value);
  }

  /**
   * IMPORTANT:
   * Normalize legacy banner data before strict validation.
   */
  if (key === "banners") {
    value = normalizeBanners(value);
  }

  if (key === "contact" && value && typeof value === "object" && !Array.isArray(value))
    value = { bannerAlt: "Contact Us", ...value };
  value = normalizeEditorSection(key, value);

  const visit = (template: any, item: any, path: string, depth = 0) => {
    if (depth > 12) {
      throw new BadRequestException("Content nesting is too deep");
    }

    if (Array.isArray(template)) {
      if (!Array.isArray(item) || item.length > 150) {
        throw new BadRequestException(
          `${path}: expected a list of up to 150 items`,
        );
      }

      item.forEach((v, i) => visit(template[0], v, `${path}[${i}]`, depth + 1));

      return;
    }

    if (template && typeof template === "object") {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new BadRequestException(`${path}: expected an object`);
      }

      for (const name of Object.keys(item)) {
        if (!Object.hasOwn(template, name)) {
          throw new BadRequestException(`${path}: unknown field ${name}`);
        }
      }

      for (const name of Object.keys(template)) {
        visit(template[name], item[name], `${path}.${name}`, depth + 1);
      }

      return;
    }

    if (typeof item !== typeof template) {
      throw new BadRequestException(`${path}: invalid value type`);
    }

    if (
      typeof item === "number" &&
      (!Number.isFinite(item) || item < 0 || item > 1000000)
    ) {
      throw new BadRequestException(`${path}: invalid number`);
    }

    if (typeof item === "string") {
      if (item.length > 20000) {
        throw new BadRequestException(`${path}: text is too long`);
      }

      const field = path.split(".").pop()!;

      if (
        /url$|image$|logo$|banner$|favicon$|background$|canonical$/i.test(
          field,
        ) &&
        item
      ) {
        /**
         * Allow:
         * /uploads/file.jpg
         * /assets/image.webp
         * https://example.com/image.jpg
         */
        const isLocalPath = /^\/(?!\/)[^\\]*$/.test(item);

        const isHttpsUrl = /^https:\/\//i.test(item);

        if (!isLocalPath && !isHttpsUrl) {
          throw new BadRequestException(
            `${path}: use a local path or HTTPS URL`,
          );
        }

        if (item.includes("\\") || /[\u0000-\u001f]/.test(item)) {
          throw new BadRequestException(`${path}: invalid URL`);
        }

        if (/^https:/i.test(item)) {
          let u: URL;

          try {
            u = new URL(item);
          } catch {
            throw new BadRequestException(`${path}: invalid URL`);
          }

          if (u.username || u.password) {
            throw new BadRequestException(
              `${path}: URL credentials are not allowed`,
            );
          }
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
        ) {
          throw new BadRequestException(
            "Maps must use a Google Maps embed URL",
          );
        }
      }

      if (field === "videoId" && !(key === "deliveryMedia" && item === "") && !/^[A-Za-z0-9_-]{11}$/.test(item)) {
        throw new BadRequestException("Invalid YouTube video ID");
      }
    }
  };

  visit(
    key === "news"
      ? newsTemplate
      : key === "banners"
        ? bannerValidationTemplate
        : key === "deliveryMedia" ? deliveryMediaTemplate : key === "contact" ? contactTemplate : key === "products" ? productValidationTemplate : defaults[key],
    value,
    key,
  );

  const doc = value as any;
  if (key === "deliveryMedia") {
    for (const item of doc.items) {
      if (!["photo", "video"].includes(item.type) || !item.title.trim() || !item.district.trim() || !item.state.trim() || (item.type === "photo" ? !item.image : !/^[A-Za-z0-9_-]{11}$/.test(item.videoId)))
        throw new BadRequestException("Each delivery needs a title, sale district, state and a photo or valid YouTube video");
      item.district = item.district.trim(); item.state = item.state.trim();
    }
  }

  /**
   * NEWS
   */
  if (key === "news") {
    const slugs = doc.items.map((a: any) => a.slug);

    if (
      new Set(slugs).size !== slugs.length ||
      slugs.some(
        (s: string) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) || s.length > 150,
      )
    ) {
      throw new BadRequestException("Invalid or duplicate article identifier");
    }

    if (
      doc.items.some(
        (a: any) =>
          !a.title.trim() ||
          !a.body.trim() ||
          !a.image ||
          !/^\d{4}-\d{2}-\d{2}$/.test(a.date) ||
          !Number.isFinite(Date.parse(a.date)) ||
          new Date(a.date).toISOString().slice(0, 10) !== a.date,
      )
    ) {
      throw new BadRequestException(
        "Each article needs an image, title, valid date and article text",
      );
    }
  }

  /**
   * SEO
   */
  if (key === "seo" && !/^#[0-9a-f]{6}$/i.test(doc.themeColor)) {
    throw new BadRequestException("Theme color must be a six-digit hex color");
  }

  /**
   * PRODUCTS
   */
  if (key === "products") {
    if (doc.items.some((item: any) => item.newStyle && item.category !== "Backhoe loaders"))
      throw new BadRequestException("New product style is available only for Backhoe loaders");
    if (doc.items.some((item: any) => item.productModel.length > 100))
      throw new BadRequestException("Product model must be at most 100 characters");
    if (
      doc.categories.length !== 2 ||
      doc.categories.some(
        (c: any, i: number) =>
          c.id !== defaults.equipment.categories[i].id ||
          c.category !== defaults.equipment.categories[i].category,
      )
    ) {
      throw new BadRequestException(
        "Keep the Backhoe loaders and Skid steers categories",
      );
    }

    if (
      doc.items.some(
        (p: any) => !p.name.trim() || p.name.length > 100 || p.id.length > 40,
      )
    ) {
      throw new BadRequestException(
        "Product names must be 1–100 characters and IDs at most 40",
      );
    }

    const ids = doc.items.map((p: any) => p.id);

    if (
      new Set(ids).size !== ids.length ||
      ids.some((id: string) => !/^[-a-z0-9]+$/.test(id))
    ) {
      throw new BadRequestException(
        "Product IDs must be unique URL-safe identifiers",
      );
    }
  }

  /**
   * CONTACT
   */
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
    ) {
      throw new BadRequestException("Keep all six original enquiry fields");
    }
  }

  /**
   * PAGE LAYOUT
   */
  if (key === "pageLayout") {
    const allowed = defaults.pageLayout.sections.map((s: any) => s.key);

    if (
      doc.sections.length !== allowed.length ||
      new Set(doc.sections.map((s: any) => s.key)).size !== allowed.length ||
      doc.sections.some((s: any) => !allowed.includes(s.key))
    ) {
      throw new BadRequestException(
        "Keep each website section once; use visibility to hide sections",
      );
    }
  }

  /**
   * BANNERS
   */
  if (key === "banners" && doc.interval < 2000) {
    throw new BadRequestException(
      "Slideshow interval must be at least 2000 ms",
    );
  }

  if (key === "banners") {
    for (const item of doc.items) {
      if (
        typeof item.title !== "string" ||
        !item.title.trim() ||
        item.title.length > 200
      ) {
        throw new BadRequestException(
          "Banner title is required (maximum 200 characters)",
        );
      }

      if (
        !Array.isArray(item.images) ||
        item.images.length < 1 ||
        item.images.length > 3
      ) {
        throw new BadRequestException("Choose between 1 and 3 banner images");
      }

      for (const image of item.images) {
        if (typeof image !== "string" || !image) {
          throw new BadRequestException("Banner image is required");
        }

        visit("", image, "banners.image");
      }

      if (
        !Array.isArray(item.states) ||
        !item.states.length ||
        new Set(item.states).size !== item.states.length ||
        item.states.some(
          (s: string) => s !== "ALL" && !indianStates.includes(s),
        ) ||
        (item.states.includes("ALL") && item.states.length !== 1)
      ) {
        throw new BadRequestException(
          "Select All States or one or more Indian states/UTs",
        );
      }

      /**
       * Maintain backward compatibility
       * with website banner rendering.
       */
      item.image = item.images[0];
      item.alt = item.title;
    }
  }

  return value;
}

export function resolveContent(rows: any[]) {
  const result = structuredClone(defaults);

  const sources: Record<string, string> = {};

  const ranks = ["COMMON", "GROUP", "DEALER", "OVERRIDE"];

  for (const layer of ranks) {
    for (const row of rows.filter((r) => r.layer === layer)) {
      if (["contact", "products"].includes(row.section_key) && layer !== "COMMON") continue;
      if (contactSections.includes(row.section_key) && !["DEALER", "OVERRIDE"].includes(layer)) continue;
      result[row.section_key] =
        typeof row.document === "string"
          ? JSON.parse(row.document)
          : row.document;

      sources[row.section_key] = layer;
    }
  }

  if (!sources.products) {
    result.products.categories = structuredClone(result.equipment.categories);

    result.products.menuHeading = result.navigation.productsLabel;
  }

  result.contact = { bannerAlt: "Contact Us", ...result.contact };
  result.locations.items = result.locations.items.slice(0, 1);
  result.social = normalizeEditorSection("social", result.social);
  result.news = normalizeNews(result.news);

  /**
   * Normalize old banner data when resolving
   * published content too.
   */
  result.banners = normalizeBanners(result.banners);

  for (const key of [
    "seo",
    "statistics",
    "products",
    "testimonials",
    "banners",
  ]) {
    result[key] = normalizeEditorSection(key, result[key], result);
  }

  return {
    content: result,
    sources,
  };
}
