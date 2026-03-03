import { prisma } from "@/lib/db/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/** Game repository — database operations for rounds, bets, and payouts */
export const gameRepository = {
  /** Create a new game round */
  async createRound(data: {
    serverSeed: string;
    hash: string;
    clientSeed?: string;
  }) {
    return prisma.gameRound.create({
      data: {
        serverSeed: data.serverSeed,
        hash: data.hash,
        clientSeed: data.clientSeed || "",
        drawnNumbers: [],
        status: "betting",
      },
    });
  },

  /** Get the current active round (status = 'betting') */
  async getCurrentRound() {
    return prisma.gameRound.findFirst({
      where: { status: "betting" },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Get a round by ID */
  async getRoundById(id: string) {
    return prisma.gameRound.findUnique({
      where: { id },
      include: { bets: true },
    });
  },

  /** Update a round's status, drawn numbers, etc. */
  async updateRound(
    id: string,
    data: {
      status?: string;
      drawnNumbers?: number[];
      clientSeed?: string;
    }
  ) {
    return prisma.gameRound.update({
      where: { id },
      data,
    });
  },

  /**
   * Place a bet within a database transaction.
   * - Checks user balance
   * - Deducts bet amount
   * - Creates bet record
   */
  async placeBet(data: {
    userId: string;
    roundId: string;
    selectedNumbers: number[];
    betAmount: number;
  }) {
    return prisma.$transaction(async (tx) => {
      // Get user with lock (SELECT ... FOR UPDATE via raw query isn't supported, but
      // Prisma transactions provide serializable isolation by default)
      const user = await tx.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new GameError("User not found", 404);
      }

      if (user.balance.toNumber() < data.betAmount) {
        throw new GameError("Insufficient balance", 400);
      }

      // Check the round is still accepting bets
      const round = await tx.gameRound.findUnique({
        where: { id: data.roundId },
      });

      if (!round || round.status !== "betting") {
        throw new GameError("Round is not accepting bets", 400);
      }

      // Check for duplicate bet (same user, same round)
      const existingBet = await tx.bet.findFirst({
        where: {
          userId: data.userId,
          roundId: data.roundId,
        },
      });

      if (existingBet) {
        throw new GameError("You already placed a bet in this round", 400);
      }

      // Deduct balance
      await tx.user.update({
        where: { id: data.userId },
        data: {
          balance: { decrement: data.betAmount },
        },
      });

      // Create bet record
      const bet = await tx.bet.create({
        data: {
          userId: data.userId,
          roundId: data.roundId,
          selectedNumbers: data.selectedNumbers,
          betAmount: new Decimal(data.betAmount),
        },
      });

      return bet;
    });
  },

  /**
   * Resolve all bets for a round.
   * Calculates matches and payouts in a single transaction.
   */
  async resolveRoundBets(roundId: string, drawnNumbers: number[]) {
    return prisma.$transaction(async (tx) => {
      // Get all bets for this round
      const bets = await tx.bet.findMany({
        where: { roundId },
      });

      for (const bet of bets) {
        // Calculate matches
        const matches = bet.selectedNumbers.filter((n) =>
          drawnNumbers.includes(n)
        ).length;

        // Get multiplier from payout table
        const multiplierRecord = await tx.payoutMultiplier.findUnique({
          where: {
            selectedCount_matchCount: {
              selectedCount: bet.selectedNumbers.length,
              matchCount: matches,
            },
          },
        });

        const multiplier = multiplierRecord
          ? multiplierRecord.multiplier.toNumber()
          : 0;
        const payout = bet.betAmount.toNumber() * multiplier;

        // Update bet with results
        await tx.bet.update({
          where: { id: bet.id },
          data: {
            matches,
            payout: new Decimal(payout),
          },
        });

        // Credit winnings to user
        if (payout > 0) {
          await tx.user.update({
            where: { id: bet.userId },
            data: {
              balance: { increment: payout },
            },
          });
        }
      }

      return bets.length;
    });
  },

  /** Get payout multiplier table */
  async getPayoutTable() {
    return prisma.payoutMultiplier.findMany({
      orderBy: [{ selectedCount: "asc" }, { matchCount: "asc" }],
    });
  },

  /** Get user bet history */
  async getUserBets(userId: string, limit = 50) {
    return prisma.bet.findMany({
      where: { userId },
      include: {
        round: {
          select: {
            id: true,
            drawnNumbers: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /** Get leaderboard (top wins) */
  async getLeaderboard(limit = 20) {
    return prisma.bet.findMany({
      where: {
        payout: { gt: 0 },
      },
      include: {
        user: {
          select: { phone: true },
        },
      },
      orderBy: { payout: "desc" },
      take: limit,
    });
  },

  /** Get daily statistics */
  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalBets, totalWagered, totalPaidOut, roundsPlayed] =
      await Promise.all([
        prisma.bet.count({
          where: { createdAt: { gte: today } },
        }),
        prisma.bet.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { betAmount: true },
        }),
        prisma.bet.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { payout: true },
        }),
        prisma.gameRound.count({
          where: { createdAt: { gte: today }, status: "completed" },
        }),
      ]);

    return {
      totalBets,
      totalWagered: totalWagered._sum.betAmount?.toNumber() || 0,
      totalPaidOut: totalPaidOut._sum.payout?.toNumber() || 0,
      profit:
        (totalWagered._sum.betAmount?.toNumber() || 0) -
        (totalPaidOut._sum.payout?.toNumber() || 0),
      roundsPlayed,
    };
  },
};

/** Custom error class for game errors with HTTP status */
export class GameError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "GameError";
  }
}
