import { Module } from "@nestjs/common";
import { ConfigModuleGlobal } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { S3Module } from "./s3/s3.module";
import { HealthController } from "./health/health.controller";
import { EventsModule } from "./events/events.module";
import { BoothsModule } from "./booths/booths.module";
import { PhotosModule } from "./photos/photos.module";

@Module({
  imports: [
    ConfigModuleGlobal,
    PrismaModule,
    S3Module,
    EventsModule,
    BoothsModule,
    PhotosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
