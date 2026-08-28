import { Module } from "@nestjs/common";
import { ConfigModuleGlobal } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { S3Module } from "./s3/s3.module";
import { EmailModule } from "./email/email.module";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health/health.controller";
import { EventsModule } from "./events/events.module";
import { BoothsModule } from "./booths/booths.module";
import { PhotosModule } from "./photos/photos.module";
import { LicensesModule } from "./licenses/licenses.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [
    ConfigModuleGlobal,
    PrismaModule,
    S3Module,
    EmailModule,
    AuthModule,
    EventsModule,
    BoothsModule,
    PhotosModule,
    LicensesModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
