import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Booth } from "@prisma/client";
import type { PresignUploadOutput } from "@photobooth/types";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../s3/s3.service";
import type { PresignPhotoDto } from "./dto/presign-photo.dto";
import type { CreatePhotoDto } from "./dto/create-photo.dto";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/webm",
  "video/mp4",
]);

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async presign(
    booth: Booth,
    dto: PresignPhotoDto,
  ): Promise<PresignUploadOutput> {
    if (!ALLOWED_CONTENT_TYPES.has(dto.contentType)) {
      throw new BadRequestException(
        `Unsupported content type: ${dto.contentType}`,
      );
    }

    const photoId = randomUUID();
    const ext = this.extensionFor(dto.fileName, dto.contentType);
    const objectKey = `events/${booth.eventId}/${photoId}.${ext}`;
    const uploadUrl = await this.s3.presignPut(objectKey, dto.contentType);

    return {
      uploadUrl,
      photoId,
      objectKey,
      expiresIn: 3600,
    };
  }

  async create(booth: Booth, dto: CreatePhotoDto) {
    const photo = await this.prisma.photo.create({
      data: {
        eventId: booth.eventId,
        boothId: booth.id,
        type: dto.type,
        aiStyle: dto.aiStyle ?? null,
        originalUrl: this.s3.publicUrl(dto.objectKey),
        status: dto.status ?? "pending",
      },
    });
    return { photo };
  }

  async listByEvent(eventId: string, take = 50, cursor?: string) {
    const limit = Math.min(Math.max(take, 1), 100);
    const photos = await this.prisma.photo.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    const nextCursor =
      photos.length === limit ? photos[photos.length - 1]!.id : null;
    return { photos, nextCursor };
  }

  async findById(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      throw new NotFoundException("Photo not found");
    }
    return photo;
  }

  private extensionFor(fileName: string, contentType: string): string {
    if (contentType === "image/png") return "png";
    if (contentType === "image/webp") return "webp";
    const fromName = fileName.split(".").pop();
    return fromName && /^[a-z0-9]{2,4}$/i.test(fromName)
      ? fromName.toLowerCase()
      : "jpg";
  }
}
