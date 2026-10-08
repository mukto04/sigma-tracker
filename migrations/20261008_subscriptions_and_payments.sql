CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "seatCount" INTEGER NOT NULL,
  "unitAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "interval" TEXT NOT NULL DEFAULT 'month',
  "status" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "paymentMethodLabel" TEXT,
  "startedAt" DATETIME,
  "currentPeriodEnd" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_companyId_status_idx" ON "Subscription"("companyId", "status");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dueAt" DATETIME,
  "paidAt" DATETIME,
  "stripeCheckoutSessionId" TEXT,
  "stripeInvoiceId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");
CREATE INDEX IF NOT EXISTS "Payment_companyId_status_createdAt_idx" ON "Payment"("companyId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Payment_subscriptionId_createdAt_idx" ON "Payment"("subscriptionId", "createdAt");
