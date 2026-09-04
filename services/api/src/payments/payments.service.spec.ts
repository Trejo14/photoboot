import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { PaymentsService } from "./payments.service";
import type { PrismaService } from "../prisma/prisma.service";
import type { LicensesService } from "../licenses/licenses.service";
import type { ConfigService } from "@nestjs/config";

function duplicateKeyError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "6.19.3",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockAsyncFn(): jest.Mock<(...args: any[]) => Promise<any>> {
  return jest.fn();
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockSyncFn(): jest.Mock<(...args: any[]) => any> {
  return jest.fn();
}

function createPrismaMock() {
  return {
    stripeEvent: { create: mockAsyncFn() },
    user: { update: mockAsyncFn(), findUnique: mockAsyncFn() },
    organization: { update: mockAsyncFn() },
    license: { updateMany: mockAsyncFn() },
  };
}

describe("PaymentsService", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let licenses: { issueLicense: ReturnType<typeof mockAsyncFn> };
  let config: { get: ReturnType<typeof mockSyncFn> };
  let mockStripe: {
    webhooks: { constructEvent: ReturnType<typeof mockSyncFn> };
    subscriptions: { retrieve: ReturnType<typeof mockAsyncFn> };
  };
  let service: PaymentsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.stripeEvent.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.update.mockResolvedValue({});
    prisma.license.updateMany.mockResolvedValue({});

    licenses = { issueLicense: mockAsyncFn() };
    licenses.issueLicense.mockResolvedValue({});

    config = { get: mockSyncFn() };
    config.get.mockImplementation((key: string) =>
      key === "STRIPE_WEBHOOK_SECRET" ? "whsec_test" : undefined,
    );

    mockStripe = {
      webhooks: { constructEvent: mockSyncFn() },
      subscriptions: { retrieve: mockAsyncFn() },
    };

    service = new PaymentsService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
      licenses as unknown as LicensesService,
    );
    // Bypass the real `new Stripe(...)` in the constructor (no secret key
    // configured in this mock) and inject our stub directly.
    (service as unknown as { stripe: typeof mockStripe }).stripe = mockStripe;
  });

  function fakeEvent(overrides: Partial<Stripe.Event>): Stripe.Event {
    return {
      id: "evt_1",
      type: "checkout.session.completed",
      ...overrides,
    } as Stripe.Event;
  }

  it("rejects when no webhook secret is configured", async () => {
    config.get.mockReturnValue(undefined);
    await expect(
      service.handleWebhook(Buffer.from("{}"), "sig"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects an invalid signature", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    await expect(
      service.handleWebhook(Buffer.from("{}"), "sig"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Regression: Stripe retries a webhook it didn't get a fast ack for.
  // Before this was guarded, a retry of checkout.session.completed issued
  // a second license for the same purchase.
  it("is a no-op on a retried (already-processed) event", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue(
      fakeEvent({
        data: {
          object: {
            metadata: { kind: "license", plan: "pro" },
            customer_details: { email: "cliente@example.com" },
          },
        },
      } as never),
    );
    prisma.stripeEvent.create.mockRejectedValue(duplicateKeyError());

    const result = await service.handleWebhook(Buffer.from("{}"), "sig");

    expect(result).toEqual({ processed: true });
    expect(licenses.issueLicense).not.toHaveBeenCalled();
  });

  it("issues a license on a license checkout completion", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue(
      fakeEvent({
        data: {
          object: {
            metadata: { kind: "license", plan: "pro" },
            customer_details: { email: "cliente@example.com" },
            customer_email: null,
            subscription: null,
            customer: null,
          },
        },
      } as never),
    );

    await service.handleWebhook(Buffer.from("{}"), "sig");

    expect(licenses.issueLicense).toHaveBeenCalledWith(
      "cliente@example.com",
      "pro",
      expect.objectContaining({
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      }),
    );
  });

  it("updates the user's plan and syncs their organization on a regular checkout", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue(
      fakeEvent({
        data: {
          object: {
            metadata: { userId: "user-1", plan: "pro" },
            subscription: null,
          },
        },
      } as never),
    );
    prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1" });

    await service.handleWebhook(Buffer.from("{}"), "sig");

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ plan: "pro", planStatus: "active" }),
      }),
    );
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { plan: "pro" },
    });
  });

  it("resets the user to free and syncs their organization when a subscription is deleted", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue(
      fakeEvent({
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_1", metadata: { userId: "user-1" } },
        },
      } as never),
    );
    prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1" });

    await service.handleWebhook(Buffer.from("{}"), "sig");

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ plan: "free", planStatus: "canceled" }),
      }),
    );
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { plan: "free" },
    });
  });

  it("revokes the license when a license subscription is deleted", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue(
      fakeEvent({
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_1", metadata: { kind: "license" } },
        },
      } as never),
    );

    await service.handleWebhook(Buffer.from("{}"), "sig");

    expect(prisma.license.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_1" },
      data: { status: "revoked" },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
