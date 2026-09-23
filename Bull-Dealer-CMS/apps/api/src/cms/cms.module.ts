import { MediaStorage } from "./media.storage";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { CmsService } from "./cms.service";
import { CmsAuthGuard } from "./auth";
import { AuthController, CmsController } from "./cms.controller";
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, CmsController],
  providers: [CmsService, CmsAuthGuard, MediaStorage],
})
export class CmsModule {}
