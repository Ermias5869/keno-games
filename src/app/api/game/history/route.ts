import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/middleware";
import { gameService } from "@/modules/game/game.service";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const history = await gameService.getBetHistory(authResult.userId);

    return NextResponse.json({ bets: history });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
