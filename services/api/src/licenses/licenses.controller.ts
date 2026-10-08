import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import type { Booth } from "@prisma/client";
import { LicensesService } from "./licenses.service";
import { ActivateLicenseDto } from "./dto/activate-license.dto";
import { CreateManualOrderDto } from "./dto/create-manual-order.dto";
import { DeviceTokenGuard } from "../auth/device-token.guard";
import { CurrentBooth } from "../auth/current-booth.decorator";
import { AdminKeyGuard } from "../auth/admin-key.guard";

@Controller("licenses")
export class LicensesController {
  constructor(private readonly licenses: LicensesService) {}

  @UseGuards(DeviceTokenGuard)
  @Post("activate")
  activate(@CurrentBooth() booth: Booth, @Body() dto: ActivateLicenseDto) {
    return this.licenses.activate(booth, dto);
  }

  @UseGuards(DeviceTokenGuard)
  @Post("validate")
  validate(@CurrentBooth() booth: Booth) {
    return this.licenses.validate(booth);
  }

  @UseGuards(AdminKeyGuard)
  @Get()
  list() {
    return this.licenses.list();
  }

  @UseGuards(AdminKeyGuard)
  @Get("customers")
  listCustomers() {
    return this.licenses.listCustomers();
  }

  @UseGuards(AdminKeyGuard)
  @Post(":id/revoke")
  revoke(@Param("id") id: string) {
    return this.licenses.revoke(id);
  }

  @Post("manual-order")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createManualOrder(@Body() dto: CreateManualOrderDto) {
    return this.licenses.createManualOrder(dto.email, dto.plan, dto.interval, dto.method);
  }

  @UseGuards(AdminKeyGuard)
  @Get("manual-orders")
  listManualOrders() {
    return this.licenses.listManualOrders();
  }

  @UseGuards(AdminKeyGuard)
  @Post("manual-orders/:id/fulfill")
  fulfillManualOrder(@Param("id") id: string) {
    return this.licenses.fulfillManualOrder(id);
  }
}