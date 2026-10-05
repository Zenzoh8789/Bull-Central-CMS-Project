import { MediaStorage } from "./media.storage";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { basename } from "node:path";

import { CmsService } from "./cms.service";
import { CmsAuthGuard } from "./auth";
import { registry } from "./content";
@Controller("api/auth")
export class AuthController {
  constructor(@Inject(CmsService) private cms: CmsService) {}
  @Post("login") login(@Body() body: any) {
    return this.cms.login(body);
  }
  @Post("enter") @UseGuards(CmsAuthGuard) enter(
    @Req() req: any,
    @Body() body: any,
    @Headers("authorization") auth: string,
  ) {
    return this.cms.enter(req.actor, auth.replace(/^Bearer /, ""), body);
  }
  @Get("me") @UseGuards(CmsAuthGuard) me(@Req() req: any) {
    return req.actor;
  }
  @Post("logout") @UseGuards(CmsAuthGuard) logout(
    @Headers("authorization") auth: string,
    @Req() req: any,
  ) {
    return this.cms.logout(auth.replace(/^Bearer /, ""), req.actor);
  }
}
@Controller("api/admin")
@UseGuards(CmsAuthGuard)
export class CmsController {
  constructor(
    @Inject(CmsService) private cms: CmsService,
    @Inject(MediaStorage) private storage: MediaStorage,
  ) {}
  @Get("employees") employees(@Req() r: any) {
    return this.cms.employees(r.actor);
  }
  @Post("employees") addEmployee(@Req() r: any, @Body() b: any) {
    return this.cms.saveEmployee(r.actor, b);
  }
  @Put("employees/:id") editEmployee(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.cms.saveEmployee(r.actor, b, id);
  }
  @Delete("employees/:id") removeEmployee(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.cms.removeEmployee(r.actor, id);
  }
  @Get("activity") activity(@Req() r: any) {
    return this.cms.activity(r.actor);
  }
  @Get("registry") registry() {
    return registry();
  }
  @Get("dashboard") dashboard(@Req() r: any) {
    return this.cms.dashboard(r.actor);
  }
  @Get("dealers") dealers(@Req() r: any) {
    return this.cms.dealers(r.actor);
  }
  @Delete("dealers/:id") deleteDealer(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.cms.deleteDealer(r.actor, id);
  }
  @Post("dealers") createDealer(@Req() r: any, @Body() b: any) {
    return this.cms.saveDealer(r.actor, b);
  }
  @Put("dealers/:id") updateDealer(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.cms.saveDealer(r.actor, b, id);
  }
  @Get("groups") groups(@Req() r: any) {
    return this.cms.groups(r.actor);
  }
  @Post("groups") createGroup(@Req() r: any, @Body() b: any) {
    return this.cms.saveGroup(r.actor, b);
  }
  @Put("groups/:id") updateGroup(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.cms.saveGroup(r.actor, b, id);
  }
  @Get("common/resolved") commonResolved(@Req() r: any) {
    return this.cms.commonResolved(r.actor);
  }
  @Get("drafts") drafts(@Req() r: any) {
    return this.cms.drafts(r.actor);
  }
  @Post("drafts") saveDraft(@Req() r: any, @Body() b: any) {
    return this.cms.saveDraft(r.actor, b);
  }
  @Delete("drafts/:id") deleteDraft(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { expectedRevision: number },
  ) {
    return this.cms.deleteDraft(r.actor, id, body);
  }
  @Get("dealers/:id/resolved") resolved(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.cms.resolveDealer(r.actor, id);
  }
  @Post("publish/preview") preview(@Req() r: any, @Body() b: any) {
    return this.cms.preview(r.actor, b);
  }
  @Post("publish") publish(@Req() r: any, @Body() b: any) {
    return this.cms.publish(r.actor, b);
  }
  @Get("history") history(@Req() r: any) {
    return this.cms.history(r.actor);
  }
  @Get("users") users(@Req() r: any) {
    return this.cms.users(r.actor);
  }
  @Patch("users/:id") setUserActive(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.cms.setUserActive(r.actor, id, b);
  }
  @Post("users") createUser(@Req() r: any, @Body() b: any) {
    return this.cms.createUser(r.actor, b);
  }
  @Get("enquiries") enquiries(@Req() r: any) {
    return this.cms.enquiries(r.actor);
  }
  @Patch("enquiries/:id") updateEnquiry(
    @Req() r: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    return this.cms.updateEnquiry(r.actor, id, b);
  }
  @Get("media") media(@Req() r: any) {
    return this.cms.media(r.actor);
  }
  @Post("media")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  async upload(@Req() r: any, @UploadedFile() file: any) {
    if (!file?.buffer)
      throw new BadRequestException("Select a PNG, JPEG, WebP or PDF file");
    const b: Buffer = file.buffer;
    let extension = "",
      mime = "";
    if (
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      extension = "png";
      mime = "image/png";
    } else if (b[0] === 255 && b[1] === 216 && b[2] === 255) {
      extension = "jpg";
      mime = "image/jpeg";
    } else if (
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP"
    ) {
      extension = "webp";
      mime = "image/webp";
    } else if (b.toString("ascii", 0, 5) === "%PDF-") {
      extension = "pdf";
      mime = "application/pdf";
    } else throw new BadRequestException("Unsupported file content");
    const stored = await this.storage.put(
      b,
      extension,
      mime,
      r.actor.role === "DEALER_ADMIN" ? r.actor.dealer_id : null,
    );
    const url = stored.url;
    try {
      await this.cms.pool.execute(
        "INSERT INTO cms_media(original_name,url,mime,size_bytes,dealer_id,created_by) VALUES (?,?,?,?,?,?)",
        [
          basename(file.originalname).slice(0, 180),
          url,
          mime,
          b.length,
          r.actor.role === "DEALER_ADMIN" ? r.actor.dealer_id : null,
          r.actor.id,
        ],
      );
    } catch (e) {
      await stored.discard().catch(() => undefined);
      throw e;
    }
    await this.cms.audit(r.actor, "UPLOAD_MEDIA", {
      name: basename(file.originalname),
      url,
    });
    return { url, mime };
  }
}
