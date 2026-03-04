import { NextResponse } from "next/server";
import { gameRepository } from "@/modules/game/game.repository";

/**
 * GET /api/game/leaderboard
 * Get top 10 users by total winnings with win rate.
 */
export async function GET() {
  try {
    const leaders = await gameRepository.getLeaderboardAggregated(10);
    return NextResponse.json({ leaders });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
