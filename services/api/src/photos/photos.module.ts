import { Module } from "@nestjs/common";
import { PhotosController } from "./photos.controller";
import { PhotosPublicController } from "./photos-public.controller";
import { PhotosService } from "./photos.service";

@Module({
  controllers: [PhotosController, PhotosPublicController],
  providers: [PhotosService],
})
export class PhotosModule {}
