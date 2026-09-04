import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ConfigModuleGlobal } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { S3Module } from "./s3/s3.module";
import { EmailModule } from "./email/email.module";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health/health.controller";
import { DownloadController } from "./download/download.controller";
import { EventsModule } from "./events/events.module";
import { BoothsModule } from "./booths/booths.module";
import { PhotosModule } from "./photos/photos.module";
import { LicensesModule } from "./licenses/licenses.module";
import { PaymentsModule } from "./payments/payments.module";
import { NewsletterModule } from "./newsletter/newsletter.module";

@Module({
  imports: [
    ConfigModuleGlobal,
    ScheduleModule.forRoot(),
    // Generous default so normal traffic (booth polling, gallery views)
    // never trips it; sensitive auth routes set tighter per-route limits
    // with @Throttle(...).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    S3Module,
    EmailModule,
    AuthModule,
    EventsModule,
    BoothsModule,
    PhotosModule,
    LicensesModule,
    PaymentsModule,
    NewsletterModule,
  ],
  controllers: [HealthController, DownloadController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
