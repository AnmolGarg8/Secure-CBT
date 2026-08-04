-- CreateTable
CREATE TABLE "UserWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'polygon-amoy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_walletAddress_key" ON "UserWallet"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_did_key" ON "UserWallet"("did");
