import { NextResponse } from "next/server";
import { gameService, GameError } from "@/modules/game/game.service";

export async function GET() {
  try {
    const round = await gameService.getCurrentRound();

    if (!round) {
      return NextResponse.json(
        { error: "No active round", round: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ round });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Get round error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
