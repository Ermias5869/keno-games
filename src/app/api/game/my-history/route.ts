import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/middleware";
import { gameRepository } from "@/modules/game/game.repository";

/**
 * GET /api/game/my-history?page=1&limit=20
 * Get authenticated user's bet history with pagination.
 * Protected — requires JWT.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const clampedPage = Math.max(1, page);
    const clampedLimit = Math.min(50, Math.max(1, limit));

    const result = await gameRepository.getUserBetHistory(
      authResult.userId,
      clampedPage,
      clampedLimit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get my history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
