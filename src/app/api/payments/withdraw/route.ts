import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/payment/payment.service";
import { verifyAuth } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, bankName, accountNumber, accountName, bankCode } = await req.json();

    if (!amount || !bankName || !accountNumber || !accountName || !bankCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount < 1) {
      return NextResponse.json({ error: "Minimum withdrawal is 1 ETB" }, { status: 400 });
    }

    const result = await paymentService.requestWithdraw({
      userId: user.id,
      amount,
      bankName,
      accountNumber,
      accountName,
      bankCode,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal" },
      { status: error.statusCode || 500 }
    );
  }
}
