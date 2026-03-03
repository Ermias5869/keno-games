import { prisma } from "@/lib/db/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/** Admin service — management and statistics operations */
export const adminService = {
  /** Get all users with their bet counts */
  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        balance: true,
        role: true,
        createdAt: true,
        _count: { select: { bets: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Get overall bet statistics */
  async getBetStats() {
    const [total, wagered, paidOut, uniquePlayers] = await Promise.all([
      prisma.bet.count(),
      prisma.bet.aggregate({ _sum: { betAmount: true } }),
      prisma.bet.aggregate({ _sum: { payout: true } }),
      prisma.bet.groupBy({ by: ["userId"] }).then((g) => g.length),
    ]);

    return {
      totalBets: total,
      totalWagered: wagered._sum.betAmount?.toNumber() || 0,
      totalPaidOut: paidOut._sum.payout?.toNumber() || 0,
      profit:
        (wagered._sum.betAmount?.toNumber() || 0) -
        (paidOut._sum.payout?.toNumber() || 0),
      uniquePlayers,
    };
  },

  /** Get current payout multipliers */
  async getMultipliers() {
    return prisma.payoutMultiplier.findMany({
      orderBy: [{ selectedCount: "asc" }, { matchCount: "asc" }],
    });
  },

  /** Update a payout multiplier */
  async updateMultiplier(id: string, multiplier: number) {
    return prisma.payoutMultiplier.update({
      where: { id },
      data: { multiplier: new Decimal(multiplier) },
    });
  },
};
