import { Controller, Get, Headers, Inject, Param } from "@nestjs/common";
import { ProductsService } from "./products.service";
@Controller("api/products")
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly products: ProductsService,
  ) {}
  @Get() findAll(@Headers("host") host: string) {
    return this.products.findAll(host);
  }
  @Get(":id") findOne(@Headers("host") host: string, @Param("id") id: string) {
    return this.products.findOne(host, id);
  }
}
