import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/jwt.strategy";
import type { CreateEventDto } from "./dto/create-event.dto";
import type { CreateOwnEventDto } from "./dto/create-own-event.dto";

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

  /** Admin-only: creates an event for an arbitrary organization. */
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
   * Self-serve: the logged-in customer creates an event for their own
   * organization (created lazily on first use, seeded from their current
   * plan), gated by the same monthly quota as the admin path.
   */
  async createForUser(user: AuthenticatedUser, dto: CreateOwnEventDto) {
    const organizationId = await this.getOrCreateOrganizationId(user);
    await this.assertMonthlyQuota(organizationId);
    return this.prisma.event.create({
      data: {
        name: dto.name,
        organizationId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  private async getOrCreateOrganizationId(
    user: AuthenticatedUser,
  ): Promise<string> {
    if (user.organizationId) return user.organizationId;

    const fresh = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh) throw new NotFoundException("Usuario no encontrado");
    if (fresh.organizationId) return fresh.organizationId;

    const org = await this.prisma.organization.create({
      data: {
        name: fresh.name?.trim() || fresh.email,
        plan: fresh.plan,
      },
    });
    await this.prisma.user.update({
      where: { id: fresh.id },
      data: { organizationId: org.id },
    });
    return org.id;
  }

  /**
   * FREE-plan organizations are limited to a handful of events per
   * calendar month; PRO/LIFETIME are unlimited. Keyed off
   * Organization.plan, which is kept in sync with the paying user's
   * subscription — see syncOrganizationPlan in payments.service.ts.
   */
  private async assertMonthlyQuota(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (org && org.plan !== "free") return;

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
