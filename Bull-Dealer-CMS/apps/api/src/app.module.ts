import { CmsModule } from "./cms/cms.module";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ProductsModule } from "./products/products.module";
import { SiteController } from "./site/site.controller";
import { EnquiriesController } from "./enquiries/enquiries.controller";
@Module({
  imports: [DatabaseModule, ProductsModule, CmsModule],
  controllers: [SiteController, EnquiriesController],
})
export class AppModule {}
