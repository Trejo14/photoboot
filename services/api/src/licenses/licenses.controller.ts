import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { Booth } from "@prisma/client";
import { LicensesService } from "./licenses.service";
import { ActivateLicenseDto } from "./dto/activate-license.dto";
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
  @Post(":id/revoke")
  revoke(@Param("id") id: string) {
    return this.licenses.revoke(id);
  }
}