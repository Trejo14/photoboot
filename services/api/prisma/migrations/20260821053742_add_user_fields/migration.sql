-- AlterTable: Add fields to User model
ALTER TABLE "User" ADD COLUMN "password" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "planStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex: Unique constraints for Stripe IDs
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- AlterTable: Add userId to VerificationCode
ALTER TABLE "VerificationCode" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "VerificationCode_userId_idx" ON "VerificationCode"("userId");

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
