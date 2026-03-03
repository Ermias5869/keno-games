import { NextResponse } from "next/server";
import { gameService } from "@/modules/game/game.service";

export async function GET() {
  try {
    const stats = await gameService.getDailyStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
