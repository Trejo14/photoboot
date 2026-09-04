import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import type { Booth, License } from "@prisma/client";
import type { ActivateLicenseOutput } from "@photobooth/types";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import type { ActivateLicenseDto } from "./dto/activate-license.dto";

export const GRACE_DAYS = 7;

const MANUAL_ORDER_PRICES: Record<string, number> = {
  "pro:monthly": 399,
  "pro:yearly": 3588,
  "lifetime:one-time": 4990,
};

export function generateLicenseKey(): string {
  const hex = randomBytes(8).toString("hex").toUpperCase();
  return `BIRD-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function maxBoothsForPlan(plan: string): number {
  return plan === "lifetime" ? 999 : 3;
}

function generateOrderReference(method: string): string {
  const prefix = method === "paypal" ? "PP" : "SPEI";
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

@Injectable()
export class LicensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService
  ) {}

  async issueLicense(
    email: string,
    plan: string,
    extra?: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      expiresAt?: Date | null;
    }
  ): Promise<License> {
    const license = await this.prisma.license.create({
      data: {
        licenseKey: generateLicenseKey(),
        plan,
        status: "active",
        maxBooths: maxBoothsForPlan(plan),
        email,
        stripeCustomerId: extra?.stripeCustomerId ?? null,
        stripeSubscriptionId: extra?.stripeSubscriptionId ?? null,
        expiresAt: extra?.expiresAt ?? null,
      },
    });

    await this.email.sendLicenseKey(email, license.licenseKey, plan);

    return license;
  }

  async createManualOrder(
    email: string,
    plan: string,
    interval: string | undefined,
    method: string
  ) {
    const priceKey = plan === "lifetime" ? "lifetime:one-time" : `pro:${interval}`;
    const amount = MANUAL_ORDER_PRICES[priceKey];
    if (!amount) {
      throw new BadRequestException("Plan o periodicidad inválidos");
    }

    const order = await this.prisma.manualOrder.create({
      data: {
        reference: generateOrderReference(method),
        method,
        email,
        plan,
        interval: plan === "lifetime" ? null : (interval ?? null),
        amount,
      },
    });

    if (method === "paypal") {
      return {
        method,
        reference: order.reference,
        amount: order.amount,
        paypalMeLink: this.config.get<string>("PAYPAL_ME_LINK") ?? null,
        paypalEmail: this.config.get<string>("PAYPAL_EMAIL") ?? null,
      };
    }

    return {
      method,
      reference: order.reference,
      amount: order.amount,
      clabe: this.config.get<string>("SPEI_CLABE") ?? null,
      bankName: this.config.get<string>("SPEI_BANK_NAME") ?? null,
      beneficiary: this.config.get<string>("SPEI_BENEFICIARY") ?? null,
    };
  }

  async listManualOrders() {
    return this.prisma.manualOrder.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async fulfillManualOrder(id: string): Promise<License> {
    const order = await this.prisma.manualOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Pedido no encontrado");
    }
    if (order.status !== "pending") {
      throw new ConflictException("Este pedido ya fue procesado");
    }

    const license = await this.issueLicense(order.email, order.plan);

    await this.prisma.manualOrder.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date(), licenseId: license.id },
    });

    return license;
  }

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