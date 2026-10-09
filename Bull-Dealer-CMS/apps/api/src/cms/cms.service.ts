import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Repository } from "../database/dealer.repository";
import {
  Actor,
  assertScope,
  digest,
  hashPassword,
  requireSuper,
  verifyPassword,
} from "./auth";
import { contactSections, registry, resolveContent, validateSection } from "./content";
import { normalizeNews } from "@bull/content/news";
import type { DraftSaveRequest } from "@bull/content/cms";
const object = (x: any) => (typeof x === "string" ? JSON.parse(x) : x);
const number = (v: any) => {
  if (!Number.isInteger(v) || v < 0)
    throw new BadRequestException("Invalid identifier");
  return v;
};
const text = (v: any, max = 200) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw new BadRequestException("Invalid text field");
  return v.trim();
};
const layers = ["COMMON", "GROUP", "DEALER", "OVERRIDE"];
@Injectable()
export class CmsService {
  constructor(@Inject(Repository) private repo: Repository) {}
  get pool() {
    if (!this.repo.pool)
      throw new ServiceUnavailableException(
        "Central CMS requires MySQL; demo mode is read-only",
      );
    return this.repo.pool;
  }
  async audit(actor: Actor, action: string, details: any) {
    await this.pool.execute(
      "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
      [actor.id, action, JSON.stringify(this.auditDetails(actor, details))],
    );
  }
  auditDetails(actor: Actor, details: any) {
    return {
      ...details,
      accountName: actor.name,
      employeeId: actor.employee_id ?? null,
      employeeName: actor.employee_name ?? null,
    };
  }
  async employees(actor: Actor) {
    requireSuper(actor);
    const [rows] = await this.pool.query(
      "SELECT id,name,department,active FROM cms_employees WHERE removed=0 ORDER BY name,id",
    );
    return rows;
  }
  async saveEmployee(actor: Actor, body: any, id?: number) {
    requireSuper(actor);
    const name = text(body.name, 100),
      department = text(body.department, 100);
    if (typeof body.active !== "boolean")
      throw new BadRequestException("Choose an employee status");
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      if (id) {
        const [rows]: any = await db.execute(
          "SELECT id FROM cms_employees WHERE id=? AND removed=0 FOR UPDATE",
          [id],
        );
        if (!rows.length) throw new NotFoundException("Employee not found");
        await db.execute(
          "UPDATE cms_employees SET name=?,department=?,active=? WHERE id=?",
          [name, department, body.active, id],
        );
        if (!body.active)
          await db.execute(
            "UPDATE cms_sessions SET employee_id=NULL,cms_entered=0 WHERE employee_id=?",
            [id],
          );
      } else {
        const [r]: any = await db.execute(
          "INSERT INTO cms_employees(name,department,active) VALUES (?,?,?)",
          [name, department, body.active],
        );
        id = r.insertId;
      }
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          body.active ? "SAVE_EMPLOYEE" : "DEACTIVATE_EMPLOYEE",
          JSON.stringify(
            this.auditDetails(actor, {
              id,
              name,
              department,
              active: body.active,
            }),
          ),
        ],
      );
      await db.commit();
      return { id };
    } catch (e) {
      await db.rollback();
      throw e;
    } finally {
      db.release();
    }
  }
  async removeEmployee(actor: Actor, id: number) {
    requireSuper(actor);
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      const [rows]: any = await db.execute(
        "SELECT id,name FROM cms_employees WHERE id=? AND removed=0 FOR UPDATE",
        [id],
      );
      if (!rows.length) throw new NotFoundException("Employee not found");
      await db.execute(
        "UPDATE cms_employees SET removed=1,active=0 WHERE id=?",
        [id],
      );
      await db.execute(
        "UPDATE cms_sessions SET employee_id=NULL,cms_entered=0 WHERE employee_id=?",
        [id],
      );
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "REMOVE_EMPLOYEE",
          JSON.stringify(this.auditDetails(actor, rows[0])),
        ],
      );
      await db.commit();
      return { ok: true };
    } catch (e) {
      await db.rollback();
      throw e;
    } finally {
      db.release();
    }
  }
  async enter(actor: Actor, token: string, body: any) {
    requireSuper(actor);
    if (
      body.employeeId !== null &&
      (!Number.isInteger(body.employeeId) || body.employeeId < 1)
    )
      throw new BadRequestException("Choose an employee or enter as admin");
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      const [sessions]: any = await db.execute(
        "SELECT cms_entered FROM cms_sessions WHERE token_hash=? AND user_id=? AND expires_at>UTC_TIMESTAMP() FOR UPDATE",
        [digest(token), actor.id],
      );
      if (!sessions.length) throw new UnauthorizedException("Session expired");
      if (sessions[0].cms_entered)
        throw new ConflictException(
          "This session already has a profile. Log out to choose another employee.",
        );
      let employee: any = null;
      if (body.employeeId !== null) {
        const [rows]: any = await db.execute(
          "SELECT id,name FROM cms_employees WHERE id=? AND active=1 AND removed=0 FOR UPDATE",
          [body.employeeId],
        );
        if (!rows.length)
          throw new BadRequestException("This employee is no longer active");
        employee = rows[0];
      }
      const user = {
        ...actor,
        employee_id: employee?.id ?? null,
        employee_name: employee?.name ?? null,
        cms_entered: true,
      };
      const [result]: any = await db.execute(
        "UPDATE cms_sessions SET employee_id=?,cms_entered=1 WHERE token_hash=? AND user_id=? AND expires_at>UTC_TIMESTAMP()",
        [user.employee_id, digest(token), actor.id],
      );
      if (!result.affectedRows)
        throw new UnauthorizedException("Session expired");
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [actor.id, "ENTER_CMS", JSON.stringify(this.auditDetails(user, {}))],
      );
      await db.commit();
      return user;
    } catch (e) {
      await db.rollback();
      throw e;
    } finally {
      db.release();
    }
  }
  async activity(actor: Actor) {
    const [rows]: any = await this.pool.execute(
      "SELECT a.*,u.name AS account FROM cms_audit a LEFT JOIN cms_users u ON u.id=a.actor_id" +
        (actor.role === "SUPER_ADMIN" ? "" : " WHERE a.actor_id=?") +
        " ORDER BY a.id DESC LIMIT 500",
      actor.role === "SUPER_ADMIN" ? [] : [actor.id],
    );
    return rows.map((row: any) => ({ ...row, details: object(row.details) }));
  }
  async login(body: any) {
    const identifier = text(body.username ?? body.email, 150).toLowerCase(),
      password = body.password;
    if (
      typeof password !== "string" ||
      !password.length ||
      password.length > 200
    )
      throw new BadRequestException("Invalid password field");
    const [rows]: any = await this.pool.execute(
      body.username
        ? "SELECT * FROM cms_users WHERE username=? AND active=1"
        : "SELECT * FROM cms_users WHERE email=? AND active=1",
      [identifier],
    );
    if (!rows.length || !verifyPassword(password, rows[0].password_hash))
      throw new UnauthorizedException("Invalid username or password");
    const token = randomBytes(32).toString("hex");
    await this.pool.execute(
      "INSERT INTO cms_sessions(token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR))",
      [digest(token), rows[0].id],
    );
    const { password_hash, ...user } = rows[0];
    await this.audit(user, "SIGN_IN", {});
    return {
      token,
      user: {
        ...user,
        cms_entered: false,
        employee_id: null,
        employee_name: null,
      },
    };
  }
  async logout(token: string, actor?: Actor) {
    if (actor) await this.audit(actor, "SIGN_OUT", {});
    await this.pool.execute("DELETE FROM cms_sessions WHERE token_hash=?", [
      digest(token),
    ]);
    return { ok: true };
  }
  async dashboard(actor: Actor) {
    const dealers = await this.dealers(actor);
    const [drafts]: any = await this.pool.execute(
      "SELECT COUNT(*) AS total FROM cms_drafts" +
        (actor.role === "DEALER_ADMIN"
          ? " WHERE layer IN ('DEALER','OVERRIDE') AND owner_id=?"
          : ""),
      actor.role === "DEALER_ADMIN" ? [actor.dealer_id] : [],
    );
    return {
      dealers: dealers.length,
      active: dealers.filter((d: any) => d.active).length,
      drafts: drafts[0].total,
      sections: registry().length,
    };
  }
  async dealers(actor: Actor) {
    const [rows]: any = await this.pool.execute(
      `SELECT d.*,COALESCE((SELECT JSON_ARRAYAGG(domain) FROM dealer_domains h WHERE h.dealer_id=d.id),JSON_ARRAY()) AS domains FROM dealers d ${actor.role === "DEALER_ADMIN" ? "WHERE d.id=?" : ""} ORDER BY d.id`,
      actor.role === "DEALER_ADMIN" ? [actor.dealer_id] : [],
    );
    return rows.map((r: any) => ({ ...r, domains: object(r.domains) }));
  }
  async deleteDealer(actor: Actor, id: number) {
    requireSuper(actor);
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      const [rows]: any = await db.execute(
        "SELECT id,name FROM dealers WHERE id=? FOR UPDATE",
        [id],
      );
      if (!rows.length) throw new NotFoundException("Dealer not found");
      await db.execute(
        "DELETE s FROM cms_sessions s JOIN cms_users u ON u.id=s.user_id WHERE u.dealer_id=?",
        [id],
      );
      await db.execute(
        "UPDATE cms_users SET active=0,dealer_id=NULL WHERE dealer_id=?",
        [id],
      );
      for (const table of [
        "dealer_domains",
        "cms_group_members",
        "cms_live",
        "cms_media",
        "enquiries",
      ])
        await db.execute("DELETE FROM " + table + " WHERE dealer_id=?", [id]);
      await db.execute(
        "DELETE FROM cms_drafts WHERE layer IN ('DEALER','OVERRIDE') AND owner_id=?",
        [id],
      );
      await db.execute("DELETE FROM dealers WHERE id=?", [id]);
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "DELETE_DEALER",
          JSON.stringify(this.auditDetails(actor, rows[0])),
        ],
      );
      await db.commit();
      return { deleted: true };
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
  }
  async saveDealer(actor: Actor, body: any, id?: number) {
    requireSuper(actor);
    const optionalRegion = (value: any) =>
      value == null || value === "" ? null : text(value, 100);
    const state = optionalRegion(body.state),
      district = optionalRegion(body.district);
    const name = text(body.name),
      location = text(body.location, 100),
      address = text(body.address, 2000),
      about = text(body.about, 20000);
    if (typeof body.active !== "boolean")
      throw new BadRequestException("Active must be boolean");
    if (
      !Array.isArray(body.domains) ||
      !body.domains.length ||
      body.domains.length > 20
    )
      throw new BadRequestException("Provide dealer domains");
    const domains = body.domains.map((d: any) => text(d, 253).toLowerCase());
    if (
      new Set(domains).size !== domains.length ||
      domains.some(
        (d: string) =>
          !/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(
            d,
          ),
      )
    )
      throw new BadRequestException("Invalid or duplicate domain");
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      if (id) {
        const [result]: any = await db.execute(
          "UPDATE dealers SET name=?,location=?,address=?,about=?,active=?,state=COALESCE(?,state),district=COALESCE(?,district) WHERE id=?",
          [name, location, address, about, body.active, state, district, id],
        );
        if (!result.affectedRows)
          throw new NotFoundException("Dealer not found");
        await db.execute("DELETE FROM dealer_domains WHERE dealer_id=?", [id]);
      } else {
        const [rows]: any = await db.query(
          "SELECT GREATEST(COALESCE(MAX(id),0), COALESCE((SELECT MAX(CAST(JSON_UNQUOTE(JSON_EXTRACT(details,'$.id')) AS UNSIGNED)) FROM cms_audit WHERE action='DELETE_DEALER'),0))+1 AS nextId FROM dealers FOR UPDATE",
        );
        id = Number(rows[0].nextId);
        await db.execute(
          "INSERT INTO dealers(id,name,location,address,about,active,state,district) VALUES (?,?,?,?,?,?,?,?)",
          [
            id,
            name,
            location,
            address,
            about,
            body.active,
            state || "",
            district || "",
          ],
        );
      }
      for (const domain of domains)
        await db.execute(
          "INSERT INTO dealer_domains(domain,dealer_id) VALUES (?,?)",
          [domain, id],
        );
      await db.commit();
    } catch (e: any) {
      await db.rollback();
      if (e.code === "ER_DUP_ENTRY")
        throw new ConflictException(
          "A domain is already assigned to another dealer",
        );
      throw e;
    } finally {
      db.release();
    }
    await this.audit(actor, "SAVE_DEALER", {
      id,
      name,
      location,
      active: body.active,
      domains,
      address,
      about,
    });
    return { id };
  }
  async groups(actor: Actor) {
    if (actor.role === "DEALER_ADMIN") return [];
    const [rows]: any = await this.pool.query(
      "SELECT g.*,COALESCE((SELECT JSON_ARRAYAGG(dealer_id) FROM cms_group_members m WHERE m.group_id=g.id),JSON_ARRAY()) AS dealerIds FROM cms_groups g ORDER BY g.name",
    );
    return rows.map((r: any) => ({ ...r, dealerIds: object(r.dealerIds) }));
  }
  async saveGroup(actor: Actor, body: any, id?: number) {
    requireSuper(actor);
    const name = text(body.name, 120);
    if (!Array.isArray(body.dealerIds) || body.dealerIds.length > 10000)
      throw new BadRequestException("Invalid group members");
    const ids = [...new Set<number>(body.dealerIds.map(number))];
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      if (id) {
        const [r]: any = await db.execute(
          "UPDATE cms_groups SET name=? WHERE id=?",
          [name, id],
        );
        if (!r.affectedRows) throw new NotFoundException("Group not found");
        await db.execute("DELETE FROM cms_group_members WHERE group_id=?", [
          id,
        ]);
      } else {
        const [r]: any = await db.execute(
          "INSERT INTO cms_groups(name) VALUES (?)",
          [name],
        );
        id = r.insertId;
      }
      for (const dealerId of ids)
        await db.execute(
          "INSERT INTO cms_group_members(group_id,dealer_id) VALUES (?,?)",
          [id!, dealerId],
        );
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "SAVE_GROUP",
          JSON.stringify(
            this.auditDetails(actor, { id, name, dealerIds: ids }),
          ),
        ],
      );
      await db.commit();
      return { id };
    } catch (e: any) {
      await db.rollback();
      if (["ER_DUP_ENTRY", "ER_NO_REFERENCED_ROW_2"].includes(e.code))
        throw new BadRequestException("Duplicate group name or unknown dealer");
      throw e;
    } finally {
      db.release();
    }
  }
  async commonResolved(actor: Actor) {
    assertScope(actor, "COMMON", 0);
    const [rows]: any = await this.pool.execute(
      "SELECT * FROM cms_live WHERE layer='COMMON' ORDER BY publication_id DESC,dealer_id ASC",
    );
    const seen = new Set<string>();
    return resolveContent(
      rows.filter((row: any) => {
        if (seen.has(row.section_key)) return false;
        seen.add(row.section_key);
        return true;
      }),
    );
  }
  async drafts(actor: Actor) {
    const [rows]: any = await this.pool.execute(
      "SELECT * FROM cms_drafts" +
        (actor.role === "DEALER_ADMIN"
          ? " WHERE layer IN ('DEALER','OVERRIDE') AND owner_id=?"
          : "") +
        " ORDER BY updated_at DESC",
      actor.role === "DEALER_ADMIN" ? [actor.dealer_id] : [],
    );
    return rows.map((r: any) => ({
      ...r,
      document:
        r.section_key === "news"
          ? normalizeNews(object(r.document))
          : object(r.document),
    }));
  }
  async saveDraft(actor: Actor, body: DraftSaveRequest) {
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new BadRequestException("Provide a draft request object");
    if (typeof body.section !== "string")
      throw new BadRequestException("section must be a CMS section key");
    if (!Number.isSafeInteger(body.ownerId) || body.ownerId < 0)
      throw new BadRequestException("ownerId must be a non-negative integer");
    if (
      !Number.isSafeInteger(body.expectedRevision) ||
      body.expectedRevision < 0
    )
      throw new BadRequestException(
        "expectedRevision must be a non-negative integer",
      );
    if (
      body.removeOverride !== undefined &&
      typeof body.removeOverride !== "boolean"
    )
      throw new BadRequestException("removeOverride must be boolean");
    const { layer, section } = body;
    if (section === "products" && layer !== "COMMON")
      throw new BadRequestException("Products can only be edited in Common selection");
    if (section === "contact" && layer !== "COMMON")
      throw new BadRequestException("Contact page banner can only be edited in Common selection");
    if (contactSections.includes(section) && !["DEALER", "OVERRIDE"].includes(layer))
      throw new BadRequestException("Contact content can only be edited for a dealer");
    const owner = number(body.ownerId),
      expected = number(body.expectedRevision);
    if (
      !layers.includes(layer) ||
      (layer === "COMMON" && owner !== 0) ||
      (layer !== "COMMON" && owner === 0)
    )
      throw new BadRequestException("Invalid content scope");
    assertScope(actor, layer, owner);
    if (body.removeOverride && layer !== "OVERRIDE")
      throw new BadRequestException("Only explicit overrides can be removed");
    body.document = validateSection(section, body.document);
    if (layer !== "COMMON") {
      const [rows]: any = await this.pool.execute(
        `SELECT id FROM ${layer === "GROUP" ? "cms_groups" : "dealers"} WHERE id=?`,
        [owner],
      );
      if (!rows.length) throw new NotFoundException("Scope does not exist");
    }
    const db = await this.pool.getConnection();
    let rows: any[];
    try {
      await db.beginTransaction();
      if (!expected) {
        await db.execute(
          "INSERT INTO cms_drafts(layer,owner_id,section_key,document,updated_by,remove_override) VALUES (?,?,?,?,?,?)",
          [
            layer,
            owner,
            section,
            JSON.stringify(body.document),
            actor.id,
            Boolean(body.removeOverride),
          ],
        );
      } else {
        const [r]: any = await db.execute(
          "UPDATE cms_drafts SET document=?,revision=revision+1,updated_by=?,remove_override=? WHERE layer=? AND owner_id=? AND section_key=? AND revision=?",
          [
            JSON.stringify(body.document),
            actor.id,
            Boolean(body.removeOverride),
            layer,
            owner,
            section,
            expected,
          ],
        );
        if (!r.affectedRows)
          throw new ConflictException("Draft changed. Reload before saving.");
      }
      const [savedRows]: any = await db.execute(
        "SELECT * FROM cms_drafts WHERE layer=? AND owner_id=? AND section_key=?",
        [layer, owner, section],
      );
      rows = savedRows;
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "SAVE_DRAFT",
          JSON.stringify(
            this.auditDetails(actor, {
              layer,
              ownerId: owner,
              section,
              revision: rows[0].revision,
            }),
          ),
        ],
      );
      await db.commit();
    } catch (e: any) {
      await db.rollback();
      if (e.code === "ER_DUP_ENTRY")
        throw new ConflictException(
          "Draft already exists. Reload before saving.",
        );
      throw e;
    } finally {
      db.release();
    }
    let published = false;
    if (actor.role !== "EDITOR") {
      const target =
        layer === "COMMON"
          ? { mode: "ALL" }
          : layer === "GROUP"
            ? { mode: "GROUP", groupId: owner }
            : { mode: "SINGLE", dealerIds: [owner] };
      const request = {
        draftIds: [rows[0].id],
        revisions: { [rows[0].id]: rows[0].revision },
        target,
      };
      try {
        const preview = await this.preview(actor, request);
        await this.publish(actor, {
          ...request,
          previewHash: preview.previewHash,
        });
        published = true;
      } catch (error: any) {
        return {
          ...rows[0],
          document: object(rows[0].document),
          published: false,
          publishError: error.message,
        };
      }
    }
    return { ...rows[0], document: object(rows[0].document), published };
  }
  async deleteDraft(
    actor: Actor,
    id: number,
    body: { expectedRevision: number },
  ) {
    const expected = number(body?.expectedRevision);
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      const [rows]: any = await db.execute(
        "SELECT * FROM cms_drafts WHERE id=? FOR UPDATE",
        [id],
      );
      if (!rows.length) throw new NotFoundException("Draft not found");
      assertScope(actor, rows[0].layer, rows[0].owner_id);
      if (rows[0].revision !== expected)
        throw new ConflictException("Draft changed. Reload before deleting.");
      await db.execute("DELETE FROM cms_drafts WHERE id=?", [id]);
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "DELETE_DRAFT",
          JSON.stringify(
            this.auditDetails(actor, {
              id,
              layer: rows[0].layer,
              ownerId: rows[0].owner_id,
              section: rows[0].section_key,
            }),
          ),
        ],
      );
      await db.commit();
      return { deleted: true };
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
  }
  async resolveDealer(actor: Actor, id: number) {
    if (actor.role === "DEALER_ADMIN" && id !== actor.dealer_id)
      throw new ForbiddenException("Other dealer");
    const [dealers]: any = await this.pool.execute(
      "SELECT * FROM dealers WHERE id=?",
      [id],
    );
    if (!dealers.length) throw new NotFoundException("Dealer not found");
    const [rows]: any = await this.pool.execute(
      "SELECT * FROM cms_live WHERE dealer_id=?",
      [id],
    );
    return { dealer: dealers[0], ...resolveContent(rows) };
  }
  private async prepare(actor: Actor, body: any, db: any, lock = false) {
    if (actor.role === "EDITOR")
      throw new ForbiddenException(
        "Editors can save drafts; publishing requires an administrator",
      );
    if (
      !Array.isArray(body.draftIds) ||
      !body.draftIds.length ||
      body.draftIds.length > 20
    )
      throw new BadRequestException("Select 1–20 drafts");
    const ids = [...new Set(body.draftIds.map(number))] as number[];
    const [drafts]: any = await db.execute(
      `SELECT * FROM cms_drafts WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id ${lock ? "FOR UPDATE" : ""}`,
      ids,
    );
    if (drafts.length !== ids.length)
      throw new NotFoundException("Draft not found");
    for (const d of drafts) {
      assertScope(actor, d.layer, d.owner_id);
      if (d.section_key === "products" && d.layer !== "COMMON")
        throw new BadRequestException("Products can only be published from Common selection");
      if (d.section_key === "contact" && d.layer !== "COMMON")
        throw new BadRequestException("Contact page banner can only be published from Common selection");
      if (contactSections.includes(d.section_key) && !["DEALER", "OVERRIDE"].includes(d.layer))
        throw new BadRequestException("Contact content can only be published for a dealer");
      if (body.revisions?.[d.id] !== d.revision)
        throw new ConflictException("Draft revision changed; preview again");
      // Also migrate legacy drafts published directly from the approval screen.
      if (!d.remove_override)
        d.document = validateSection(d.section_key, object(d.document));
    }
    if (
      new Set(drafts.map((d: any) => d.layer + ":" + d.section_key)).size !==
      drafts.length
    )
      throw new BadRequestException(
        "Choose only one draft per layer and section",
      );
    const target = body.target;
    if (
      !target ||
      !["ALL", "GROUP", "SELECTED", "SINGLE"].includes(target.mode)
    )
      throw new BadRequestException("Invalid publishing target");
    let sql = "SELECT d.id,d.name FROM dealers d WHERE d.active=1";
    const params: any[] = [];
    if (target.mode === "GROUP") {
      sql +=
        " AND EXISTS(SELECT 1 FROM cms_group_members m WHERE m.dealer_id=d.id AND m.group_id=?)";
      params.push(number(target.groupId));
    }
    if (["SELECTED", "SINGLE"].includes(target.mode)) {
      if (
        !Array.isArray(target.dealerIds) ||
        !target.dealerIds.length ||
        (target.mode === "SINGLE" && target.dealerIds.length !== 1)
      )
        throw new BadRequestException("Choose target dealers");
      const selected = [...new Set(target.dealerIds.map(number))];
      sql += ` AND d.id IN (${selected.map(() => "?").join(",")})`;
      params.push(...selected);
    }
    const [recipients]: any = await db.execute(
      sql + " ORDER BY d.id" + (lock ? " FOR UPDATE" : ""),
      params,
    );
    if (!recipients.length)
      throw new BadRequestException("No active dealers match this target");
    if (
      ["SELECTED", "SINGLE"].includes(target.mode) &&
      recipients.length !== new Set(target.dealerIds).size
    )
      throw new BadRequestException("A selected dealer is inactive or missing");
    if (
      actor.role === "DEALER_ADMIN" &&
      (target.mode !== "SINGLE" || recipients[0].id !== actor.dealer_id)
    )
      throw new ForbiddenException(
        "Dealer admins may publish only to their own dealer",
      );
    for (const d of drafts) {
      if (
        ["DEALER", "OVERRIDE"].includes(d.layer) &&
        recipients.some((r: any) => r.id !== d.owner_id)
      )
        throw new BadRequestException(
          "Dealer content can only be published to its owner",
        );
      if (d.layer === "GROUP") {
        const [members]: any = await db.execute(
          "SELECT dealer_id FROM cms_group_members WHERE group_id=?",
          [d.owner_id],
        );
        if (
          recipients.some(
            (r: any) => !members.some((m: any) => m.dealer_id === r.id),
          )
        )
          throw new BadRequestException(
            "Group content can only target members of its source group",
          );
      }
    }
    const previewHash = digest(
      JSON.stringify({
        ids: drafts.map((d: any) => [
          d.id,
          d.revision,
          Boolean(d.remove_override),
        ]),
        recipients: recipients.map((r: any) => r.id),
        target,
      }),
    );
    const [live]: any = await db.execute(
      `SELECT dealer_id,section_key FROM cms_live WHERE layer='OVERRIDE' AND dealer_id IN (${recipients.map(() => "?").join(",")})`,
      recipients.map((r: any) => r.id),
    );
    return {
      drafts,
      recipients,
      previewHash,
      preservedOverrides: live.filter((l: any) =>
        drafts.some(
          (d: any) => d.section_key === l.section_key && d.layer !== "OVERRIDE",
        ),
      ).length,
    };
  }
  async preview(actor: Actor, body: any) {
    const p = await this.prepare(actor, body, this.pool);
    return {
      ...p,
      drafts: p.drafts.map((d: any) => ({
        ...d,
        document: object(d.document),
      })),
    };
  }
  async publish(actor: Actor, body: any) {
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      const p = await this.prepare(actor, body, db, true);
      if (body.previewHash !== p.previewHash)
        throw new ConflictException(
          "Target list or revision changed; preview again",
        );
      const [r]: any = await db.execute(
        "INSERT INTO cms_publications(actor_id,target,revisions,recipients) VALUES (?,?,?,?)",
        [
          actor.id,
          JSON.stringify(body.target),
          JSON.stringify(
            p.drafts.map((d: any) => ({
              id: d.id,
              layer: d.layer,
              owner: d.owner_id,
              section: d.section_key,
              revision: d.revision,
              document: object(d.document),
              removeOverride: Boolean(d.remove_override),
            })),
          ),
          JSON.stringify(p.recipients.map((d: any) => d.id)),
        ],
      );
      for (const recipient of p.recipients)
        for (const d of p.drafts) {
          if (d.remove_override) {
            await db.execute(
              "DELETE FROM cms_live WHERE dealer_id=? AND layer='OVERRIDE' AND section_key=?",
              [recipient.id, d.section_key],
            );
          } else {
            await db.execute(
              "INSERT INTO cms_live(dealer_id,layer,section_key,source_owner,revision,document,publication_id) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE source_owner=VALUES(source_owner),revision=VALUES(revision),document=VALUES(document),publication_id=VALUES(publication_id)",
              [
                recipient.id,
                d.layer,
                d.section_key,
                d.owner_id,
                d.revision,
                JSON.stringify(object(d.document)),
                r.insertId,
              ],
            );
          }
        }
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "PUBLISH",
          JSON.stringify(
            this.auditDetails(actor, {
              publicationId: r.insertId,
              dealerIds: p.recipients.map((d: any) => d.id),
              count: p.recipients.length,
            }),
          ),
        ],
      );
      await db.commit();
      return {
        publicationId: r.insertId,
        affected: p.recipients.length,
        preservedOverrides: p.preservedOverrides,
      };
    } catch (e) {
      await db.rollback();
      throw e;
    } finally {
      db.release();
    }
  }
  async history(actor: Actor) {
    const [rows]: any = await this.pool.execute(
      "SELECT p.*,u.name AS actor FROM cms_publications p JOIN cms_users u ON u.id=p.actor_id" +
        (actor.role === "DEALER_ADMIN"
          ? " WHERE JSON_CONTAINS(p.recipients,CAST(? AS JSON))"
          : "") +
        " ORDER BY p.id DESC LIMIT 100",
      actor.role === "DEALER_ADMIN" ? [JSON.stringify(actor.dealer_id)] : [],
    );
    return rows.map((r: any) => ({
      ...r,
      target:
        actor.role === "DEALER_ADMIN"
          ? { mode: "SINGLE", dealerIds: [actor.dealer_id] }
          : object(r.target),
      revisions: object(r.revisions),
      recipients:
        actor.role === "DEALER_ADMIN"
          ? [actor.dealer_id]
          : object(r.recipients),
    }));
  }
  async users(actor: Actor) {
    requireSuper(actor);
    const [rows]: any = await this.pool.query(
      "SELECT id,name,email,username,role,dealer_id,active FROM cms_users ORDER BY id",
    );
    return rows;
  }
  async setUserActive(actor: Actor, id: number, body: any) {
    requireSuper(actor);
    if (typeof body.active !== "boolean")
      throw new BadRequestException("Active must be boolean");
    if (id === actor.id && !body.active)
      throw new BadRequestException("You cannot deactivate your own account");
    const db = await this.pool.getConnection();
    try {
      await db.beginTransaction();
      const [r]: any = await db.execute(
        "UPDATE cms_users SET active=? WHERE id=?",
        [body.active, id],
      );
      if (!r.affectedRows) throw new NotFoundException("User not found");
      if (!body.active)
        await db.execute("DELETE FROM cms_sessions WHERE user_id=?", [id]);
      await db.execute(
        "INSERT INTO cms_audit(actor_id,action,details) VALUES (?,?,?)",
        [
          actor.id,
          "USER_STATUS",
          JSON.stringify(this.auditDetails(actor, { id, active: body.active })),
        ],
      );
      await db.commit();
      return { ok: true };
    } catch (e) {
      await db.rollback();
      throw e;
    } finally {
      db.release();
    }
  }
  async createUser(actor: Actor, body: any) {
    requireSuper(actor);
    if (!["SUPER_ADMIN", "EDITOR", "DEALER_ADMIN"].includes(body.role))
      throw new BadRequestException("Invalid role");
    const password = body.password;
    if (typeof password !== "string" || password.length > 200)
      throw new BadRequestException("Invalid password field");
    if (password.length < 12)
      throw new BadRequestException("Use at least 12 characters");
    const email = text(body.email, 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException("Invalid email");
    const username = body.username
      ? text(body.username, 80).toLowerCase()
      : "user-" + randomBytes(8).toString("hex");
    if (!/^[a-z0-9_.-]{3,80}$/.test(username))
      throw new BadRequestException("Invalid username");
    const dealerId =
      body.role === "DEALER_ADMIN" ? number(body.dealerId) : null;
    try {
      const [r]: any = await this.pool.execute(
        "INSERT INTO cms_users(name,email,password_hash,role,dealer_id,username) VALUES (?,?,?,?,?,?)",
        [
          text(body.name, 100),
          email,
          hashPassword(password),
          body.role,
          dealerId,
          username,
        ],
      );
      await this.audit(actor, "CREATE_USER", {
        id: r.insertId,
        name: body.name,
        role: body.role,
      });
      return { id: r.insertId };
    } catch (e: any) {
      if (["ER_DUP_ENTRY", "ER_NO_REFERENCED_ROW_2"].includes(e.code))
        throw new BadRequestException(
          "Username/email already exists or dealer is invalid",
        );
      throw e;
    }
  }
  async enquiries(actor: Actor) {
    const [rows]: any = await this.pool.execute(
      "SELECT * FROM enquiries" +
        (actor.role === "DEALER_ADMIN" ? " WHERE dealer_id=?" : "") +
        " ORDER BY id DESC LIMIT 500",
      actor.role === "DEALER_ADMIN" ? [actor.dealer_id] : [],
    );
    return rows;
  }
  async updateEnquiry(actor: Actor, id: number, body: any) {
    if (!["NEW", "CONTACTED", "CLOSED"].includes(body.status))
      throw new BadRequestException("Invalid enquiry status");
    const [r]: any = await this.pool.execute(
      "UPDATE enquiries SET status=? WHERE id=?" +
        (actor.role === "DEALER_ADMIN" ? " AND dealer_id=?" : ""),
      actor.role === "DEALER_ADMIN"
        ? [body.status, id, actor.dealer_id]
        : [body.status, id],
    );
    if (!r.affectedRows) throw new NotFoundException("Enquiry not found");
    await this.audit(actor, "UPDATE_ENQUIRY", {
      id,
      status: body.status,
      dealerId: actor.dealer_id,
    });
    return { ok: true };
  }
  async media(actor: Actor) {
    const [rows]: any = await this.pool.execute(
      "SELECT * FROM cms_media" +
        (actor.role === "DEALER_ADMIN"
          ? " WHERE dealer_id IS NULL OR dealer_id=?"
          : "") +
        " ORDER BY id DESC",
      actor.role === "DEALER_ADMIN" ? [actor.dealer_id] : [],
    );
    return rows;
  }
}
