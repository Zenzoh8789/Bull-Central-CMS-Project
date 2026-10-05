import { bannerMatches } from "@bull/content/banners";
import { resolveContent } from "../cms/content";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createPool, Pool, RowDataPacket } from "mysql2/promise";
import { randomUUID } from "node:crypto";
import { dealer, products, localHosts, normaliseHost } from "../data";
import { EnquiryDto } from "../enquiries/dto/create-enquiry.dto";
@Injectable()
export class Repository implements OnModuleDestroy, OnModuleInit {
  readonly demo = process.env.DEMO_MODE === "true";
  pool?: Pool;
  constructor() {
    if (!this.demo) {
      if (!process.env.DATABASE_URL)
        throw new Error(
          "DATABASE_URL is required. Set DEMO_MODE=true only for a local preview.",
        );
      this.pool = createPool(process.env.DATABASE_URL);
    }
  }
  async onModuleInit() {
    if (!this.pool) return;
    try {
      await this.pool.query(
        "SELECT username,password_hash FROM cms_users LIMIT 0",
      );
      await this.pool.query(
        "SELECT token_hash,expires_at,employee_id,cms_entered FROM cms_sessions LIMIT 0",
      );
      await this.pool.query("SELECT dealer_id,document FROM cms_live LIMIT 0");
      await this.pool.query("SELECT state,district FROM dealers LIMIT 0");
      await this.pool.query(
        "SELECT domain,dealer_id FROM dealer_domains LIMIT 0",
      );
      await this.pool.query(
        "SELECT address,district,status FROM enquiries LIMIT 0",
      );
      const [users]: any = await this.pool.query(
        "SELECT id FROM cms_users WHERE role='SUPER_ADMIN' AND active=1 LIMIT 1",
      );
      if (!users.length)
        throw new Error(
          "CMS administrator is missing. Run npm run setup:cms from the project root.",
        );
    } catch (error: any) {
      await this.pool.end();
      throw new Error(
        error.code
          ? "Database readiness failed (" +
              error.code +
              "). Check DATABASE_URL in the root .env, start MySQL, then run npm run db:migrate and npm run setup:cms from the project root."
          : error.message,
      );
    }
  }
  async onModuleDestroy() {
    await this.pool?.end();
  }
  async site(host: string) {
    const domain = normaliseHost(host);
    if (this.demo) {
      if (
        !localHosts.has(domain) &&
        domain !== "bulltaraautohub.com" &&
        domain !== "www.bulltaraautohub.com"
      )
        throw new NotFoundException("Dealer not found");
      const resolved = resolveContent([]);
      resolved.content.about.heading = dealer.name;
      resolved.content.about.text = dealer.about;
      resolved.content.dealerContact = {
        ...resolved.content.dealerContact,
        name: dealer.name,
        address: dealer.address,
      };
      return { dealer, products, mode: "demo", ...resolved };
    }
    try {
      const lookup =
        localHosts.has(domain) && process.env.NODE_ENV !== "production"
          ? (process.env.LOCAL_DEALER_DOMAIN || domain)
          : domain;
      const [rows] = await this.pool!.execute<RowDataPacket[]>(
        "SELECT d.* FROM dealers d JOIN dealer_domains h ON h.dealer_id = d.id WHERE h.domain = ? AND d.active = 1",
        [lookup],
      );
      if (!rows.length) throw new NotFoundException("Dealer not found");
      const [live]: any = await this.pool!.execute(
        "SELECT * FROM cms_live WHERE dealer_id=?",
        [rows[0].id],
      );
      const resolved = resolveContent(live);
      resolved.content.banners.items = resolved.content.banners.items.filter(
        (item: any) => bannerMatches(item, {state: rows[0].state, location: rows[0].location}),
      );
      if (!resolved.sources.about) {
        resolved.content.about.heading = rows[0].name;
        resolved.content.about.text = rows[0].about;
      }
      if (!resolved.sources.dealerContact) {
        resolved.content.dealerContact.name = rows[0].name;
        resolved.content.dealerContact.address = rows[0].address;
      }
      return {
        dealer: rows[0],
        products: resolved.content.products.enabled
          ? resolved.content.products.items
          : [],
        mode: "mysql",
        ...resolved,
      };
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
  async save(host: string, dto: EnquiryDto) {
    const site = await this.site(host);
    if (
      ![
        "Help me choose",
        "Service & spare parts",
        ...site.products.map((p: any) => p.name),
      ].includes(dto.product)
    )
      throw new BadRequestException("Choose a valid product");
    // Demo mode must never claim that a lead has been durably saved.
    if (this.demo)
      throw new ServiceUnavailableException(
        "Enquiries require MySQL. This is a read-only demo.",
      );
    if (!site.content.contact.enabled)
      throw new BadRequestException("Contact form is disabled");
    for (const field of site.content.contact.fields) {
      if (field.required && !String((dto as any)[field.name] || "").trim())
        throw new BadRequestException(field.label + " is required");
    }
    const reference = `TAH-${randomUUID()}`;
    try {
      await this.pool!.execute(
        "INSERT INTO enquiries (reference,dealer_id,name,phone,email,product,message,consent,address,district) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
          reference,
          site.dealer.id,
          dto.name,
          dto.phone,
          dto.email || null,
          dto.product,
          dto.message,
          dto.consent,
          dto.address || "",
          dto.district || "",
        ],
      );
      return { reference };
    } catch {
      throw new ServiceUnavailableException("Unable to save enquiry");
    }
  }
}
