import { prisma } from "@/lib/db/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/** Mask a phone number: +251912345678 → +25***5678 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return phone.slice(0, 3) + "***" + phone.slice(-4);
}

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
   * - Creates bet record with status PENDING
   */
  async placeBet(data: {
    userId: string;
    roundId: string;
    selectedNumbers: number[];
    betAmount: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new GameError("User not found", 404);
      }

      if (user.balance.toNumber() < data.betAmount) {
        throw new GameError("Insufficient balance", 400);
      }

      const round = await tx.gameRound.findUnique({
        where: { id: data.roundId },
      });

      if (!round || round.status !== "betting") {
        throw new GameError("Round is not accepting bets", 400);
      }

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

      // Create bet record with PENDING status
      const bet = await tx.bet.create({
        data: {
          userId: data.userId,
          roundId: data.roundId,
          selectedNumbers: data.selectedNumbers,
          betAmount: new Decimal(data.betAmount),
          status: "PENDING",
        },
        include: {
          user: { select: { phone: true } },
        },
      });

      return bet;
    });
  },

  /**
   * Resolve all bets for a round.
   * Calculates matches, payouts, and sets bet status (WON/LOST).
   */
  async resolveRoundBets(roundId: string, drawnNumbers: number[]) {
    return prisma.$transaction(async (tx) => {
      const bets = await tx.bet.findMany({
        where: { roundId },
      });

      for (const bet of bets) {
        const matches = bet.selectedNumbers.filter((n) =>
          drawnNumbers.includes(n)
        ).length;

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
        const status = payout > 0 ? "WON" : "LOST";

        // Update bet with results and status
        await tx.bet.update({
          where: { id: bet.id },
          data: {
            matches,
            payout: new Decimal(payout),
            status,
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

  // ── New queries for tabs ──

  /** GAME TAB: Get all bets for the current round with masked usernames */
  async getCurrentRoundBets(roundId: string) {
    const bets = await prisma.bet.findMany({
      where: { roundId },
      include: {
        user: { select: { phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return bets.map((bet) => ({
      id: bet.id,
      username: maskPhone(bet.user.phone),
      selectedNumbers: bet.selectedNumbers,
      betAmount: bet.betAmount.toNumber(),
      status: bet.status,
      createdAt: bet.createdAt,
    }));
  },

  /** HISTORY TAB: Get authenticated user's bet history with pagination */
  async getUserBetHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
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
        skip,
        take: limit,
      }),
      prisma.bet.count({ where: { userId } }),
    ]);

    return {
      bets: bets.map((bet) => ({
        id: bet.id,
        roundId: bet.roundId,
        selectedNumbers: bet.selectedNumbers,
        betAmount: bet.betAmount.toNumber(),
        matches: bet.matches,
        payout: bet.payout.toNumber(),
        status: bet.status,
        drawnNumbers: bet.round.drawnNumbers,
        createdAt: bet.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** RESULTS TAB: Get last N completed rounds with aggregate stats */
  async getCompletedRounds(limit = 100, order: "asc" | "desc" = "desc") {
    const rounds = await prisma.gameRound.findMany({
      where: { status: "completed" },
      include: {
        _count: { select: { bets: true } },
        bets: {
          select: { payout: true },
        },
      },
      orderBy: { createdAt: order },
      take: limit,
    });

    return rounds.map((round) => ({
      id: round.id,
      drawnNumbers: round.drawnNumbers,
      totalBets: round._count.bets,
      totalPayout: round.bets.reduce(
        (sum, bet) => sum + bet.payout.toNumber(),
        0
      ),
      createdAt: round.createdAt,
    }));
  },

  /** LEADERS TAB: Top 10 users by total winnings with aggregate */
  async getLeaderboardAggregated(limit = 10) {
    // Aggregate total payout and bet count grouped by userId
    const leaders = await prisma.bet.groupBy({
      by: ["userId"],
      _sum: { payout: true, betAmount: true },
      _count: { id: true },
      orderBy: {
        _sum: { payout: "desc" },
      },
      take: limit,
    });

    // Count wins per user
    const userIds = leaders.map((l) => l.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phone: true },
    });

    const winCounts = await prisma.bet.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "WON" },
      _count: { id: true },
    });

    const winCountMap = new Map(
      winCounts.map((w) => [w.userId, w._count.id])
    );
    const userMap = new Map(users.map((u) => [u.id, u.phone]));

    return leaders.map((leader) => {
      const totalBets = leader._count.id;
      const wins = winCountMap.get(leader.userId) || 0;
      return {
        username: maskPhone(userMap.get(leader.userId) || "unknown"),
        totalWinnings: leader._sum.payout?.toNumber() || 0,
        totalBets,
        winRate: totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0,
      };
    });
  },

  /** Get payout multiplier table */
  async getPayoutTable() {
    return prisma.payoutMultiplier.findMany({
      orderBy: [{ selectedCount: "asc" }, { matchCount: "asc" }],
    });
  },

  /** Get user bet history (legacy) */
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
