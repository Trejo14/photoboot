import { Body, Controller, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { NewsletterService } from "./newsletter.service";
import { SubscribeDto } from "./dto/subscribe.dto";

@Controller("newsletter")
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post("subscribe")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto.email);
  }
}
