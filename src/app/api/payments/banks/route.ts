import { NextResponse } from "next/server";
import { chapaService } from "@/modules/payment/chapa.service";

export async function GET() {
  try {
    const banks = await chapaService.getBanks();
    return NextResponse.json(banks);
  } catch (error) {
    console.error("Failed to fetch banks:", error);
    return NextResponse.json(
      { error: "Failed to fetch supported banks" },
      { status: 500 }
    );
  }
}
