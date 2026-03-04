import { NextRequest, NextResponse } from "next/server";
import { gameRepository } from "@/modules/game/game.repository";

/**
 * GET /api/game/current-bets?roundId=xxx
 * Get all bets for the current round (public, masked usernames).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      // Try to get the current active round
      const round = await gameRepository.getCurrentRound();
      if (!round) {
        return NextResponse.json({ bets: [], roundId: null });
      }
      const bets = await gameRepository.getCurrentRoundBets(round.id);
      return NextResponse.json({ bets, roundId: round.id });
    }

    const bets = await gameRepository.getCurrentRoundBets(roundId);
    return NextResponse.json({ bets, roundId });
  } catch (error) {
    console.error("Get current bets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
