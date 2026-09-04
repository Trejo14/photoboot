-- AlterTable
ALTER TABLE "License" ADD COLUMN "email" TEXT;
ALTER TABLE "License" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "License" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "License_stripeCustomerId_key" ON "License"("stripeCustomerId");
CREATE UNIQUE INDEX "License_stripeSubscriptionId_key" ON "License"("stripeSubscriptionId");
