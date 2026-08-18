import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { Booth } from "@prisma/client";
import { PhotosService } from "./photos.service";
import { PresignPhotoDto } from "./dto/presign-photo.dto";
import { CreatePhotoDto } from "./dto/create-photo.dto";
import { DeviceTokenGuard } from "../auth/device-token.guard";
import { CurrentBooth } from "../auth/current-booth.decorator";

@Controller("photos")
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @UseGuards(DeviceTokenGuard)
  @Post("presign")
  presign(@CurrentBooth() booth: Booth, @Body() dto: PresignPhotoDto) {
    return this.photos.presign(booth, dto);
  }

  @UseGuards(DeviceTokenGuard)
  @Post()
  create(@CurrentBooth() booth: Booth, @Body() dto: CreatePhotoDto) {
    return this.photos.create(booth, dto);
  }
}
