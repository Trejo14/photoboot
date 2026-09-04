import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { Booth } from "@prisma/client";
import { BoothsService } from "./booths.service";
import { RegisterBoothDto } from "./dto/register-booth.dto";
import { DeviceTokenGuard } from "../auth/device-token.guard";
import { CurrentBooth } from "../auth/current-booth.decorator";

@Controller("booths")
export class BoothsController {
  constructor(private readonly booths: BoothsService) {}

  @Post("register")
  register(@Body() dto: RegisterBoothDto) {
    return this.booths.register(dto);
  }

  @UseGuards(DeviceTokenGuard)
  @Post("heartbeat")
  heartbeat(@CurrentBooth() booth: Booth) {
    return this.booths.heartbeat(booth);
  }

  @UseGuards(DeviceTokenGuard)
  @Post("rotate-token")
  rotateToken(@CurrentBooth() booth: Booth) {
    return this.booths.rotateToken(booth);
  }

  @UseGuards(DeviceTokenGuard)
  @Get("me/status")
  getStatus(@CurrentBooth() booth: Booth) {
    return this.booths.getStatus(booth);
  }
}
