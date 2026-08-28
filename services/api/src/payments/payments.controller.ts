import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Req,
  RawBodyRequest,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import type { AuthenticatedRequest } from "../auth/jwt.guard";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("checkout")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createCheckout(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto
  ) {
    return this.payments.createCheckoutSession(
      req.user!.id,
      req.user!.email,
      dto.plan,
      dto.interval
    );
  }

  @Post("webhook")
  handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Body() body: Buffer
  ) {
    const signature = req.headers["stripe-signature"] as string;
    return this.payments.handleWebhook(
      req.rawBody ?? body as unknown as Buffer,
      signature
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("subscription")
  getSubscription(@Request() req: AuthenticatedRequest) {
    return this.payments.getSubscription(req.user!.id);
  }
}
