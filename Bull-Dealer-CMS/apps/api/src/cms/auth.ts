import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { Repository } from "../database/dealer.repository";
export type Actor = {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR" | "DEALER_ADMIN";
  dealer_id: number | null;
};
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  if (typeof hash !== "string" || !/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(hash)) return false;
  const [salt, key] = hash.split(":");
  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(key || "", "hex");
  return (
    stored.length === candidate.length && timingSafeEqual(candidate, stored)
  );
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
@Injectable()
export class CmsAuthGuard implements CanActivate {
  constructor(@Inject(Repository) private repo: Repository) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token || !this.repo.pool)
      throw new UnauthorizedException("Sign in to the CMS");
    const [rows]: any = await this.repo.pool.execute(
      "SELECT u.id,u.name,u.email,u.role,u.dealer_id FROM cms_sessions s JOIN cms_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND u.active=1",
      [digest(token)],
    );
    if (!rows.length) throw new UnauthorizedException("Session expired");
    req.actor = rows[0];
    return true;
  }
}
export function requireSuper(actor: Actor) {
  if (actor.role !== "SUPER_ADMIN")
    throw new ForbiddenException("Super admin permission required");
}
export function assertScope(actor: Actor, layer: string, owner: number) {
  if (
    actor.role === "DEALER_ADMIN" &&
    (!["DEALER", "OVERRIDE"].includes(layer) || owner !== actor.dealer_id)
  )
    throw new ForbiddenException("This content belongs to another scope");
}
