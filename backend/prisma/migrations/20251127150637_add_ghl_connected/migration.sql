-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "companyName" TEXT,
    "onboardingToken" TEXT NOT NULL,
    "calendlyConnected" BOOLEAN NOT NULL DEFAULT false,
    "closeConnected" BOOLEAN NOT NULL DEFAULT false,
    "ghlConnected" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientIntegration" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "apiKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookedCall" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookedCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "status" TEXT,
    "firstContactDate" TIMESTAMP(3),
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "stage" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStageChangeDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStatusMapping" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "statusType" TEXT,
    "showedUp" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityStatusMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_onboardingToken_key" ON "Client"("onboardingToken");

-- CreateIndex
CREATE INDEX "ClientIntegration_clientId_provider_idx" ON "ClientIntegration"("clientId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ClientIntegration_clientId_provider_key" ON "ClientIntegration"("clientId", "provider");

-- CreateIndex
CREATE INDEX "BookedCall_clientId_source_idx" ON "BookedCall"("clientId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "BookedCall_clientId_externalId_source_key" ON "BookedCall"("clientId", "externalId", "source");

-- CreateIndex
CREATE INDEX "Lead_clientId_source_idx" ON "Lead"("clientId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_clientId_externalId_source_key" ON "Lead"("clientId", "externalId", "source");

-- CreateIndex
CREATE INDEX "Payment_clientId_provider_idx" ON "Payment"("clientId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_clientId_externalId_provider_key" ON "Payment"("clientId", "externalId", "provider");

-- CreateIndex
CREATE INDEX "Deal_clientId_source_idx" ON "Deal"("clientId", "source");

-- CreateIndex
CREATE INDEX "Deal_clientId_stage_idx" ON "Deal"("clientId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_clientId_externalId_source_key" ON "Deal"("clientId", "externalId", "source");

-- CreateIndex
CREATE INDEX "OpportunityStatusMapping_clientId_idx" ON "OpportunityStatusMapping"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityStatusMapping_clientId_statusId_key" ON "OpportunityStatusMapping"("clientId", "statusId");

-- AddForeignKey
ALTER TABLE "ClientIntegration" ADD CONSTRAINT "ClientIntegration_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookedCall" ADD CONSTRAINT "BookedCall_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStatusMapping" ADD CONSTRAINT "OpportunityStatusMapping_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
