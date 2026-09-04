import Stripe from "stripe";
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { LicensesService } from "../licenses/licenses.service";

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly licenses: LicensesService
  ) {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException(
        "Pagos no configurados. Contacta al administrador."
      );
    }
    return this.stripe;
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    plan: string,
    interval: string
  ): Promise<{ url: string }> {
    const stripe = this.getStripe();

    let priceId: string;
    if (plan === "pro") {
      priceId =
        interval === "yearly"
          ? this.config.getOrThrow("STRIPE_PRICE_PRO_YEARLY")
          : this.config.getOrThrow("STRIPE_PRICE_PRO_MONTHLY");
    } else if (plan === "lifetime") {
      priceId = this.config.getOrThrow("STRIPE_PRICE_LIFETIME");
    } else {
      throw new BadRequestException("Plan inválido");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    let customerId = user?.stripeCustomerId ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const successUrl = this.config.getOrThrow("STRIPE_SUCCESS_URL");
    const cancelUrl = this.config.getOrThrow("STRIPE_CANCEL_URL");

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: interval === "one-time" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { userId, plan },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new BadRequestException("Error creando sesión de pago");
    }

    return { url: session.url };
  }

  async createLicenseCheckoutSession(
    email: string,
    plan: string,
    interval?: string
  ): Promise<{ url: string }> {
    const stripe = this.getStripe();

    let priceId: string;
    const isSubscription = plan === "pro";
    if (plan === "pro") {
      priceId =
        interval === "monthly"
          ? this.config.getOrThrow("STRIPE_PRICE_PRO_MONTHLY")
          : this.config.getOrThrow("STRIPE_PRICE_PRO_YEARLY");
    } else if (plan === "lifetime") {
      priceId = this.config.getOrThrow("STRIPE_PRICE_LIFETIME");
    } else {
      throw new BadRequestException("Plan inválido");
    }

    const successUrl = this.config.getOrThrow("STRIPE_SUCCESS_URL");
    const cancelUrl = this.config.getOrThrow("STRIPE_CANCEL_URL");
    const metadata = { kind: "license", plan };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: email,
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata,
      ...(isSubscription ? { subscription_data: { metadata } } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new BadRequestException("Error creando sesión de pago");
    }

    return { url: session.url };
  }

  private async handleLicenseCheckoutCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const email = session.customer_details?.email ?? session.customer_email;
    const plan = session.metadata?.plan;
    if (!email || !plan) return;

    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;

    let expiresAt: Date | null = null;
    if (subscriptionId) {
      const stripe = this.getStripe();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = subscription.items.data[0]?.current_period_end;
      if (periodEnd) {
        expiresAt = new Date(periodEnd * 1000);
      }
    }

    await this.licenses.issueLicense(email, plan, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      expiresAt,
    });
  }

  private async updateLicenseFromSubscription(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const statusMap: Record<string, string> = {
      active: "active",
      trialing: "active",
      past_due: "active",
      canceled: "revoked",
      unpaid: "revoked",
    };
    await this.prisma.license.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: statusMap[subscription.status] ?? "active",
        expiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
  }

  async handleWebhook(
    payload: Buffer,
    signature: string
  ): Promise<{ processed: boolean }> {
    const stripe = this.getStripe();
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new BadRequestException("Webhook secret no configurado");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch {
      throw new BadRequestException("Webhook signature inválida");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "license") {
          await this.handleLicenseCheckoutCompleted(session);
          break;
        }
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : null;

          let planExpiresAt: Date | null = null;
          if (subscriptionId) {
            const stripe = this.getStripe();
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );
            const periodEnd = subscription.items.data[0]?.current_period_end;
            if (periodEnd) {
              planExpiresAt = new Date(periodEnd * 1000);
            }
          }

          await this.prisma.user.update({
            where: { id: userId },
            data: {
              plan,
              planStatus: "active",
              planExpiresAt,
              stripeSubscriptionId: subscriptionId,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.kind === "license") {
          await this.updateLicenseFromSubscription(subscription);
          break;
        }
        const userId = subscription.metadata?.userId;
        if (userId) {
          const statusMap: Record<string, string> = {
            active: "active",
            canceled: "canceled",
            past_due: "past_due",
            trialing: "trialing",
            unpaid: "canceled",
          };
          const periodEnd = subscription.items.data[0]?.current_period_end;
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              planStatus:
                statusMap[subscription.status] ?? subscription.status,
              planExpiresAt: periodEnd
                ? new Date(periodEnd * 1000)
                : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.kind === "license") {
          await this.prisma.license.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: "revoked" },
          });
          break;
        }
        const userId = subscription.metadata?.userId;
        if (userId) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              plan: "free",
              planStatus: "canceled",
              planExpiresAt: null,
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : null;
        if (customerId) {
          const user = await this.prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (user) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { planStatus: "past_due" },
            });
          }
        }
        break;
      }
    }

    return { processed: true };
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException("Usuario no encontrado");
    }
    return {
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };
  }
}
