import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import type { Booth, License, LicenseActivation } from "@prisma/client";
import { LicensesService } from "./licenses.service";
import type { PrismaService } from "../prisma/prisma.service";
import type { EmailService } from "../email/email.service";
import type { ConfigService } from "@nestjs/config";

function makeBooth(deviceToken: string): Booth {
  return {
    id: "booth-1",
    eventId: "event-1",
    deviceToken,
    name: "Cabina 1",
    lastSeenAt: null,
    createdAt: new Date(),
  };
}

function makeLicense(overrides: Partial<License> = {}): License {
  return {
    id: "lic-1",
    licenseKey: "BIRD-AAAA-BBBB-CCCC-DDDD",
    plan: "pro",
    status: "active",
    maxBooths: 3,
    organizationId: null,
    email: "cliente@example.com",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    expiresAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeActivation(
  overrides: Partial<LicenseActivation> = {},
): LicenseActivation {
  return {
    id: "act-1",
    licenseId: "lic-1",
    deviceToken: "existing-device",
    activatedAt: new Date(),
    lastValidatedAt: new Date(),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockFn(): jest.Mock<(...args: any[]) => Promise<any>> {
  return jest.fn();
}

function createPrismaMock() {
  return {
    license: {
      findUnique: mockFn(),
      create: mockFn(),
      update: mockFn(),
      findMany: mockFn(),
    },
    licenseActivation: {
      create: mockFn(),
      update: mockFn(),
      findUnique: mockFn(),
    },
  };
}

function createEmailMock() {
  return { sendLicenseKey: mockFn() };
}

describe("LicensesService", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let email: ReturnType<typeof createEmailMock>;
  let service: LicensesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    email = createEmailMock();
    service = new LicensesService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService,
      {} as ConfigService,
    );
  });

  describe("issueLicense", () => {
    it("caps maxBooths at 3 for the pro plan", async () => {
      prisma.license.create.mockResolvedValue(makeLicense());
      await service.issueLicense("cliente@example.com", "pro");
      expect(prisma.license.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxBooths: 3 }),
        }),
      );
    });

    it("allows effectively unlimited booths for the lifetime plan", async () => {
      prisma.license.create.mockResolvedValue(
        makeLicense({ plan: "lifetime" }),
      );
      await service.issueLicense("cliente@example.com", "lifetime");
      expect(prisma.license.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxBooths: 999 }),
        }),
      );
    });

    it("emails the license key to the buyer", async () => {
      const license = makeLicense();
      prisma.license.create.mockResolvedValue(license);
      await service.issueLicense("cliente@example.com", "pro");
      expect(email.sendLicenseKey).toHaveBeenCalledWith(
        "cliente@example.com",
        license.licenseKey,
        "pro",
      );
    });
  });

  describe("activate", () => {
    it("rejects an unknown license key", async () => {
      prisma.license.findUnique.mockResolvedValue(null);
      await expect(
        service.activate(makeBooth("device-1"), { licenseKey: "BAD" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects a revoked license", async () => {
      prisma.license.findUnique.mockResolvedValue({
        ...makeLicense({ status: "revoked" }),
        activations: [],
      });
      await expect(
        service.activate(makeBooth("device-1"), { licenseKey: "X" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("rejects an expired license", async () => {
      prisma.license.findUnique.mockResolvedValue({
        ...makeLicense({ expiresAt: new Date(Date.now() - 1000) }),
        activations: [],
      });
      await expect(
        service.activate(makeBooth("device-1"), { licenseKey: "X" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("activates a new device when under the maxBooths limit", async () => {
      prisma.license.findUnique.mockResolvedValue({
        ...makeLicense({ maxBooths: 3 }),
        activations: [makeActivation({ deviceToken: "device-a" })],
      });
      await service.activate(makeBooth("device-b"), { licenseKey: "X" });
      expect(prisma.licenseActivation.create).toHaveBeenCalledWith({
        data: { licenseId: "lic-1", deviceToken: "device-b" },
      });
    });

    it("is idempotent when the same device re-activates", async () => {
      prisma.license.findUnique.mockResolvedValue({
        ...makeLicense({ maxBooths: 1 }),
        activations: [makeActivation({ id: "act-1", deviceToken: "device-a" })],
      });
      await service.activate(makeBooth("device-a"), { licenseKey: "X" });
      expect(prisma.licenseActivation.create).not.toHaveBeenCalled();
      expect(prisma.licenseActivation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "act-1" } }),
      );
    });

    // Regression: License.deviceToken used to be a 1:1 field, so a plan's
    // maxBooths (e.g. 3 for PRO) was structurally impossible to reach — the
    // first activation blocked every other device from ever using the key.
    it("blocks a new device once maxBooths is reached", async () => {
      prisma.license.findUnique.mockResolvedValue({
        ...makeLicense({ maxBooths: 3 }),
        activations: [
          makeActivation({ id: "a", deviceToken: "device-1" }),
          makeActivation({ id: "b", deviceToken: "device-2" }),
          makeActivation({ id: "c", deviceToken: "device-3" }),
        ],
      });
      await expect(
        service.activate(makeBooth("device-4"), { licenseKey: "X" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.licenseActivation.create).not.toHaveBeenCalled();
    });
  });

  describe("validate", () => {
    it("reports the free plan for a device with no activation", async () => {
      prisma.licenseActivation.findUnique.mockResolvedValue(null);
      const result = await service.validate(makeBooth("device-1"));
      expect(result.plan).toBe("free");
    });

    it("rejects a device whose license was revoked", async () => {
      prisma.licenseActivation.findUnique.mockResolvedValue({
        ...makeActivation(),
        license: makeLicense({ status: "revoked" }),
      });
      await expect(
        service.validate(makeBooth("device-1")),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("refreshes lastValidatedAt on a healthy activation", async () => {
      const activation = { ...makeActivation(), license: makeLicense() };
      prisma.licenseActivation.findUnique.mockResolvedValue(activation);
      await service.validate(makeBooth("device-1"));
      expect(prisma.licenseActivation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: activation.id } }),
      );
    });
  });

  describe("revoke", () => {
    it("marks the license revoked without touching device activations", async () => {
      prisma.license.findUnique.mockResolvedValue(makeLicense());
      await service.revoke("lic-1");
      expect(prisma.license.update).toHaveBeenCalledWith({
        where: { id: "lic-1" },
        data: { status: "revoked" },
      });
    });

    it("rejects an unknown license id", async () => {
      prisma.license.findUnique.mockResolvedValue(null);
      await expect(service.revoke("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
