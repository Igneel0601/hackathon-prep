-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PaymentMethodSetting" (
    "method" "PaymentMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "upiId" TEXT,
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodSetting_pkey" PRIMARY KEY ("method")
);
