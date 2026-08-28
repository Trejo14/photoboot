import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Booth } from "@prisma/client";
import type { ActivateLicenseOutput } from "@photobooth/types";
import { PrismaService } from "../prisma/prisma.service";
import type { ActivateLicenseDto } from "./dto/activate-license.dto";

export const GRACE_DAYS = 7;

@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(
    booth: Booth,
    dto: ActivateLicenseDto
  ): Promise<ActivateLicenseOutput> {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey: dto.licenseKey },
    });
    if (!license) {
      throw new NotFoundException("Clave de licencia inválida");
    }
    if (license.status === "revoked") {
      throw new ForbiddenException("Licencia revocada");
    }
    if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException("Licencia expirada");
    }
    if (license.deviceToken && license.deviceToken !== booth.deviceToken) {
      throw new ConflictException("La licencia ya está activada en otra cabina");
    }

    await this.prisma.license.update({
      where: { id: license.id },
      data: {
        deviceToken: booth.deviceToken,
        activatedAt: new Date(),
        lastValidatedAt: new Date(),
      },
    });

    return {
      plan: license.plan as ActivateLicenseOutput["plan"],
      expiresAt: license.expiresAt ? license.expiresAt.getTime() : null,
      graceDays: GRACE_DAYS,
    };
  }

  async validate(booth: Booth): Promise<ActivateLicenseOutput> {
    const license = await this.prisma.license.findUnique({
      where: { deviceToken: booth.deviceToken },
    });
    if (!license) {
      return { plan: "free", expiresAt: null, graceDays: GRACE_DAYS };
    }
    if (license.status === "revoked") {
      throw new ForbiddenException("Licencia revocada");
    }
    if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException("Licencia expirada");
    }

    await this.prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: new Date() },
    });

    return {
      plan: license.plan as ActivateLicenseOutput["plan"],
      expiresAt: license.expiresAt ? license.expiresAt.getTime() : null,
      graceDays: GRACE_DAYS,
    };
  }

  async list() {
    return this.prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      include: { organization: true },
    });
  }

  async revoke(id: string) {
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) {
      throw new NotFoundException("Licencia no encontrada");
    }
    return this.prisma.license.update({
      where: { id },
      data: { status: "revoked", deviceToken: null },
    });
  }
}