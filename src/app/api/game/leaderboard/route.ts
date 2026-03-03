import { NextResponse } from "next/server";
import { gameService } from "@/modules/game/game.service";

export async function GET() {
  try {
    const leaderboard = await gameService.getLeaderboard();
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
