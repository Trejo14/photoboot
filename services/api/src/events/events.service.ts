import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateEventDto } from "./dto/create-event.dto";

const FREE_PLAN_MONTHLY_EVENT_LIMIT = 2;

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

  async listAll() {
    return this.prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { booths: true, photos: true } } },
    });
  }

  async create(dto: CreateEventDto) {
    await this.assertMonthlyQuota(dto.organizationId);
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

  /**
   * FREE-plan organizations are limited to a handful of events per
   * calendar month; PRO/LIFETIME (or an org with no license yet, which
   * shouldn't happen but shouldn't block a first event either) are
   * unlimited. The limit is keyed off the organization's most recently
   * created active license, since that's what the booth app itself
   * activates against.
   */
  private async assertMonthlyQuota(organizationId: string) {
    const license = await this.prisma.license.findFirst({
      where: { organizationId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (license && license.plan !== "free") return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const countThisMonth = await this.prisma.event.count({
      where: {
        organizationId,
        startDate: { gte: monthStart, lt: monthEnd },
      },
    });

    if (countThisMonth >= FREE_PLAN_MONTHLY_EVENT_LIMIT) {
      throw new BadRequestException(
        `El plan FREE permite ${FREE_PLAN_MONTHLY_EVENT_LIMIT} eventos por mes. Esta organización ya alcanzó el límite de este mes; activa PRO o LIFETIME para eventos ilimitados.`,
      );
    }
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
