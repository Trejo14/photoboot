import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import { PhotosService } from "./photos.service";

@Controller("photos")
export class PhotosPublicController {
  constructor(private readonly photos: PhotosService) {}

  @Get()
  list(@Query("eventId") eventId?: string) {
    if (!eventId) {
      throw new BadRequestException("eventId query parameter is required");
    }
    return this.photos.listByEvent(eventId);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    const photo = await this.photos.findById(id);
    return { photo };
  }
}
