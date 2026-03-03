import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/middleware";
import { InitializePaymentSchema } from "@/modules/payment/payment.schema";
import {
  paymentService,
  PaymentError,
} from "@/modules/payment/payment.service";
import { checkRateLimit } from "@/lib/utils/rate-limit";

/**
 * POST /api/payments/chapa/initialize
 * Initialize a Chapa deposit transaction.
 * Protected — requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    // Rate limit: max 3 payment initializations per minute per user
    if (
      !checkRateLimit(`payment:init:${authResult.userId}`, {
        maxRequests: 3,
        windowMs: 60_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many payment requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = InitializePaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { amount } = result.data;

    // Initialize payment with Chapa
    const paymentData = await paymentService.initializeDeposit(
      authResult.userId,
      amount
    );

    return NextResponse.json(paymentData, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Initialize payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
