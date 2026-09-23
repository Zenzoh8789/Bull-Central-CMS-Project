import { Body, Controller, Headers, Inject, Post } from "@nestjs/common";
import { Repository } from "../database/dealer.repository";
import { EnquiryDto } from "./dto/create-enquiry.dto";
@Controller("api/enquiries")
export class EnquiriesController {
  constructor(@Inject(Repository) private readonly repository: Repository) {}
  @Post() create(@Headers("host") host: string, @Body() body: EnquiryDto) {
    return this.repository.save(host, body);
  }
}
