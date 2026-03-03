import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/middleware";
import {
  paymentService,
  PaymentError,
} from "@/modules/payment/payment.service";

/**
 * GET /api/payments/chapa/verify?tx_ref=xxx
 *
 * Manual verification endpoint — fallback when webhook doesn't arrive.
 * Calls Chapa verify API and syncs DB status.
 * Protected — requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    // Get tx_ref from query
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json(
        { error: "tx_ref query parameter is required" },
        { status: 400 }
      );
    }

    // Verify and sync transaction
    const result = await paymentService.verifyAndSync(txRef);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
