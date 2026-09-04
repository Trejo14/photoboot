import { Controller, Get, Param } from "@nestjs/common";
import { PhotosService } from "./photos.service";

// Only single-photo lookup by its random id is public — that's the actual
// use case (a guest opening their own /p/[photoId] link). Listing every
// photo in an event is admin-only, see PhotosController.
@Controller("photos")
export class PhotosPublicController {
  constructor(private readonly photos: PhotosService) {}

  @Get(":id")
  async findById(@Param("id") id: string) {
    const photo = await this.photos.findById(id);
    return { photo };
  }
}
