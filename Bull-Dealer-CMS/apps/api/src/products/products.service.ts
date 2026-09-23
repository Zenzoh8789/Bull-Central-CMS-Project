import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "../database/dealer.repository";
@Injectable()
export class ProductsService {
  constructor(@Inject(Repository) private readonly repository: Repository) {}
  async findAll(host: string) {
    const site = await this.repository.site(host);
    return site.products;
  }
  async findOne(host: string, id: string) {
    const products = await this.findAll(host);
    const product = products.find((p: any) => p.id === id);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }
}
