import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../s3/s3.service";

@Injectable()
export class PhotosCleanupService {
  private readonly logger = new Logger(PhotosCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly config: ConfigService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredPhotos(): Promise<{ scanned: number; deleted: number }> {
    const retentionHours = this.config.get<number>("PHOTO_RETENTION_HOURS") ?? 32;
    const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);

    const expired = await this.prisma.photo.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, originalUrl: true, processedUrl: true },
    });

    if (expired.length === 0) return { scanned: 0, deleted: 0 };

    let deleted = 0;
    for (const photo of expired) {
      try {
        for (const url of [photo.originalUrl, photo.processedUrl]) {
          if (!url) continue;
          const key = this.s3.keyFromPublicUrl(url);
          if (key) {
            await this.s3.deleteObject(key).catch((err) => {
              this.logger.warn(
                `No se pudo borrar el objeto S3 ${key}: ${(err as Error).message}`
              );
            });
          }
        }
        await this.prisma.photo.delete({ where: { id: photo.id } });
        deleted++;
      } catch (err) {
        this.logger.error(
          `Error limpiando la foto ${photo.id}: ${(err as Error).message}`
        );
      }
    }

    this.logger.log(
      `Limpieza de fotos: ${deleted}/${expired.length} fotos con más de ${retentionHours}h eliminadas`
    );

    return { scanned: expired.length, deleted };
  }
}
