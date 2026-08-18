import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { Booth } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterBoothDto } from "./dto/register-booth.dto";
import type { RegisterBoothOutput } from "@photobooth/types";

@Injectable()
export class BoothsService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterBoothDto): Promise<RegisterBoothOutput> {
    const event = await this.prisma.event.findUnique({ where: { id: dto.eventId } });
    if (!event) {
      throw new NotFoundException("Event not found");
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
}
