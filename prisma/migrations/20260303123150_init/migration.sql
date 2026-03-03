-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL,
    "drawnNumbers" INTEGER[],
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL DEFAULT '',
    "hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'betting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "selectedNumbers" INTEGER[],
    "betAmount" DECIMAL(12,2) NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "payout" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutMultiplier" (
    "id" TEXT NOT NULL,
    "selectedCount" INTEGER NOT NULL,
    "matchCount" INTEGER NOT NULL,
    "multiplier" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PayoutMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "GameRound_status_idx" ON "GameRound"("status");

-- CreateIndex
CREATE INDEX "GameRound_createdAt_idx" ON "GameRound"("createdAt");

-- CreateIndex
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");

-- CreateIndex
CREATE INDEX "Bet_roundId_idx" ON "Bet"("roundId");

-- CreateIndex
CREATE INDEX "Bet_createdAt_idx" ON "Bet"("createdAt");

-- CreateIndex
CREATE INDEX "PayoutMultiplier_selectedCount_idx" ON "PayoutMultiplier"("selectedCount");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutMultiplier_selectedCount_matchCount_key" ON "PayoutMultiplier"("selectedCount", "matchCount");

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "GameRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
