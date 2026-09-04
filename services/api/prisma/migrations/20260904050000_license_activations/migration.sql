-- CreateTable
CREATE TABLE "LicenseActivation" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastValidatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseActivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseActivation_deviceToken_key" ON "LicenseActivation"("deviceToken");

-- CreateIndex
CREATE INDEX "LicenseActivation_licenseId_idx" ON "LicenseActivation"("licenseId");

-- AddForeignKey
ALTER TABLE "LicenseActivation" ADD CONSTRAINT "LicenseActivation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every previously-activated License had exactly one device
-- (the old 1:1 deviceToken column). Carry that over as its first activation
-- row, reusing the deviceToken itself as the id since it was already unique.
INSERT INTO "LicenseActivation" ("id", "licenseId", "deviceToken", "activatedAt", "lastValidatedAt")
SELECT "deviceToken", "id", "deviceToken", COALESCE("activatedAt", CURRENT_TIMESTAMP), COALESCE("lastValidatedAt", CURRENT_TIMESTAMP)
FROM "License"
WHERE "deviceToken" IS NOT NULL;

-- DropColumn
ALTER TABLE "License" DROP COLUMN "deviceToken",
DROP COLUMN "activatedAt",
DROP COLUMN "lastValidatedAt";
