import { NextRequest, NextResponse } from "next/server";
import {
  paymentService,
  PaymentError,
} from "@/modules/payment/payment.service";

/**
 * POST /api/payments/chapa/webhook
 *
 * Chapa sends this webhook after payment completion.
 * SECURITY CRITICAL:
 * - Verifies signature header
 * - Verifies transaction via Chapa API
 * - Uses idempotent DB update (safe to receive multiple times)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("chapa-signature") ||
                      request.headers.get("x-chapa-signature");

    // Parse the payload
    let payload: { tx_ref: string; status: string };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!payload.tx_ref) {
      return NextResponse.json(
        { error: "Missing tx_ref in payload" },
        { status: 400 }
      );
    }

    // Process the webhook
    const result = await paymentService.processWebhook(
      signature,
      rawBody,
      payload
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Webhook processing error:", error);
    // Return 200 even on internal errors to prevent Chapa from retrying endlessly
    // The manual verify endpoint can be used as fallback
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 200 }
    );
  }
}
