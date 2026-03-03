import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/middleware";
import { PlaceBetSchema } from "@/modules/game/game.schema";
import { gameService, GameError } from "@/modules/game/game.service";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    // Anti-spam: max 5 bets per minute per user
    if (!checkRateLimit(`bet:${authResult.userId}`, { maxRequests: 5, windowMs: 60_000 })) {
      return NextResponse.json(
        { error: "Too many bets. Please wait before placing another." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = PlaceBetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { selectedNumbers, betAmount, roundId } = result.data;
    const bet = await gameService.placeBet(
      authResult.userId,
      selectedNumbers,
      betAmount,
      roundId
    );

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Place bet error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
