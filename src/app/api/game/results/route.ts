import { NextRequest, NextResponse } from "next/server";
import { gameRepository } from "@/modules/game/game.repository";

/**
 * GET /api/game/results?limit=100&order=desc
 * Get last N completed rounds with stats (total bets, total payout).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "100", 10));
    const order = searchParams.get("order") === "asc" ? "asc" as const : "desc" as const;

    const rounds = await gameRepository.getCompletedRounds(limit, order);
    return NextResponse.json({ rounds });
  } catch (error) {
    console.error("Get results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
