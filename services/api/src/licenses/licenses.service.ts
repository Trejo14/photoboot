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

export interface Customer {
  email: string;
  name: string | null;
  plan: string;
  registered: boolean;
  licenses: {
    licenseKey: string;
    plan: string;
    status: string;
    expiresAt: Date | null;
  }[];
  pendingOrders: number;
  firstSeenAt: Date;
}

@Injectable()
export class LicensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async issueLicense(
    email: string,
    plan: string,
    extra?: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      expiresAt?: Date | null;
    },
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
    method: string,
  ) {
    const priceKey =
      plan === "lifetime" ? "lifetime:one-time" : `pro:${interval}`;
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
    dto: ActivateLicenseDto,
  ): Promise<ActivateLicenseOutput> {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey: dto.licenseKey },
      include: { activations: true },
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

    const existing = license.activations.find(
      (a) => a.deviceToken === booth.deviceToken,
    );
    if (existing) {
      await this.prisma.licenseActivation.update({
        where: { id: existing.id },
        data: { lastValidatedAt: new Date() },
      });
    } else {
      if (license.activations.length >= license.maxBooths) {
        throw new ConflictException(
          `Esta licencia ya alcanzó el máximo de ${license.maxBooths} cabina(s) para el plan ${license.plan}.`,
        );
      }
      await this.prisma.licenseActivation.create({
        data: { licenseId: license.id, deviceToken: booth.deviceToken },
      });
    }

    return {
      plan: license.plan as ActivateLicenseOutput["plan"],
      expiresAt: license.expiresAt ? license.expiresAt.getTime() : null,
      graceDays: GRACE_DAYS,
    };
  }

  async validate(booth: Booth): Promise<ActivateLicenseOutput> {
    const activation = await this.prisma.licenseActivation.findUnique({
      where: { deviceToken: booth.deviceToken },
      include: { license: true },
    });
    if (!activation) {
      return { plan: "free", expiresAt: null, graceDays: GRACE_DAYS };
    }
    const license = activation.license;
    if (license.status === "revoked") {
      throw new ForbiddenException("Licencia revocada");
    }
    if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException("Licencia expirada");
    }

    await this.prisma.licenseActivation.update({
      where: { id: activation.id },
      data: { lastValidatedAt: new Date() },
    });

    return {
      plan: license.plan as ActivateLicenseOutput["plan"],
      expiresAt: license.expiresAt ? license.expiresAt.getTime() : null,
      graceDays: GRACE_DAYS,
    };
  }

  async list() {
    const licenses = await this.prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      include: { organization: true, activations: true },
    });

    return licenses.map(({ activations, ...license }) => ({
      ...license,
      activeDevices: activations.length,
      activatedAt: activations.length
        ? new Date(Math.min(...activations.map((a) => a.activatedAt.getTime())))
        : null,
      lastValidatedAt: activations.length
        ? new Date(
            Math.max(...activations.map((a) => a.lastValidatedAt.getTime())),
          )
        : null,
    }));
  }

  /**
   * Clientes = cualquier correo que haya iniciado sesión (User), comprado
   * (License) o pedido un pago manual (ManualOrder), agrupado por correo.
   */
  async listCustomers(): Promise<Customer[]> {
    const [users, licenses, pendingOrders] = await Promise.all([
      this.prisma.user.findMany({
        select: { email: true, name: true, createdAt: true },
      }),
      this.prisma.license.findMany({
        where: { email: { not: null } },
        orderBy: { createdAt: "desc" },
        select: {
          email: true,
          licenseKey: true,
          plan: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
      this.prisma.manualOrder.findMany({
        where: { status: "pending" },
        select: { email: true, createdAt: true },
      }),
    ]);

    const byEmail = new Map<string, Customer>();
    const touch = (rawEmail: string, seenAt: Date): Customer => {
      const email = rawEmail.toLowerCase().trim();
      let customer = byEmail.get(email);
      if (!customer) {
        customer = {
          email,
          name: null,
          plan: "free",
          registered: false,
          licenses: [],
          pendingOrders: 0,
          firstSeenAt: seenAt,
        };
        byEmail.set(email, customer);
      } else if (seenAt < customer.firstSeenAt) {
        customer.firstSeenAt = seenAt;
      }
      return customer;
    };

    for (const user of users) {
      const customer = touch(user.email, user.createdAt);
      customer.name = user.name;
      customer.registered = true;
    }

    const planRank: Record<string, number> = { free: 0, pro: 1, lifetime: 2 };
    const now = Date.now();
    for (const { email, createdAt, ...license } of licenses) {
      if (!email) continue;
      const customer = touch(email, createdAt);
      customer.licenses.push(license);
      const usable =
        license.status === "active" &&
        (!license.expiresAt || license.expiresAt.getTime() >= now);
      if (
        usable &&
        (planRank[license.plan] ?? 0) > (planRank[customer.plan] ?? 0)
      ) {
        customer.plan = license.plan;
      }
    }

    for (const order of pendingOrders) {
      touch(order.email, order.createdAt).pendingOrders += 1;
    }

    return [...byEmail.values()].sort(
      (a, b) => b.firstSeenAt.getTime() - a.firstSeenAt.getTime(),
    );
  }

  async revoke(id: string) {
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) {
      throw new NotFoundException("Licencia no encontrada");
    }
    return this.prisma.license.update({
      where: { id },
      data: { status: "revoked" },
    });
  }
}
