-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "maxBooths" INTEGER NOT NULL DEFAULT 1,
    "deviceToken" TEXT,
    "organizationId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "License_deviceToken_key" ON "License"("deviceToken");

-- CreateIndex
CREATE INDEX "License_organizationId_idx" ON "License"("organizationId");

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
