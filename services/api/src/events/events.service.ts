import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateEventDto } from "./dto/create-event.dto";

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(organizationId: string | null) {
    if (!organizationId) return [];
    return this.prisma.event.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { booths: true, photos: true } } },
    });
  }

  async create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        name: dto.name,
        organizationId: dto.organizationId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        themeConfig: (dto.themeConfig ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        booths: { orderBy: { createdAt: "asc" } },
        photos: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    return event;
  }
}
