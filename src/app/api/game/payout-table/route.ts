import { NextResponse } from "next/server";
import { gameService } from "@/modules/game/game.service";

export async function GET() {
  try {
    const payoutTable = await gameService.getPayoutTable();
    return NextResponse.json({ payoutTable });
  } catch (error) {
    console.error("Get payout table error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
