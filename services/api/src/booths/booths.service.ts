import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { Booth } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterBoothDto } from "./dto/register-booth.dto";
import type { RegisterBoothOutput } from "@photobooth/types";

@Injectable()
export class BoothsService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterBoothDto): Promise<RegisterBoothOutput> {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    if (event.endDate && event.endDate.getTime() < Date.now()) {
      throw new ForbiddenException("Este evento ya finalizó.");
    }

    const deviceToken = randomBytes(32).toString("hex");
    const booth = await this.prisma.booth.create({
      data: {
        eventId: dto.eventId,
        name: dto.name,
        deviceToken,
        lastSeenAt: new Date(),
      },
    });

    return { boothId: booth.id, deviceToken: booth.deviceToken };
  }

  async heartbeat(booth: Booth): Promise<Booth> {
    return this.prisma.booth.update({
      where: { id: booth.id },
      data: { lastSeenAt: new Date() },
    });
  }

  async rotateToken(booth: Booth): Promise<Booth> {
    const deviceToken = randomBytes(32).toString("hex");
    return this.prisma.booth.update({
      where: { id: booth.id },
      data: { deviceToken },
    });
  }

  async getStatus(booth: Booth): Promise<{
    eventId: string;
    eventName: string | null;
    finished: boolean;
    endDate: Date | null;
  }> {
    const event = await this.prisma.event.findUnique({
      where: { id: booth.eventId },
    });
    const finished = !!(event?.endDate && event.endDate.getTime() < Date.now());
    return {
      eventId: booth.eventId,
      eventName: event?.name ?? null,
      finished,
      endDate: event?.endDate ?? null,
    };
  }
}
