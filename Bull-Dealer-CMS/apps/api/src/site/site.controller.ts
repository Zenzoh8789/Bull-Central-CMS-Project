import { Controller, Get, Headers, Inject } from "@nestjs/common";
import { Repository } from "../database/dealer.repository";
@Controller("api")
export class SiteController {
  constructor(@Inject(Repository) private readonly repository: Repository) {}
  @Get("health") async health() {
    if (this.repository.pool) await this.repository.pool.query("SELECT 1");
    return { status: "ok", mode: this.repository.demo ? "demo" : "mysql" };
  }
  @Get("site") site(@Headers("host") host: string) {
    return this.repository.site(host);
  }
}
