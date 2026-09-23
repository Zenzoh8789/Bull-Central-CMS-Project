import { Module } from "@nestjs/common";
import { Repository } from "./dealer.repository";
@Module({ providers: [Repository], exports: [Repository] })
export class DatabaseModule {}
