import { randomUUID } from "crypto";
import { chapaService, ChapaError } from "./chapa.service";
import {
  paymentRepository,
  PaymentError,
} from "./payment.repository";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * PaymentService — business logic for payment operations.
 * Orchestrates between ChapaService (API) and PaymentRepository (DB).
 */
export const paymentService = {
  /**
   * Initialize a deposit payment.
   *
   * Flow:
   * 1. Generate unique tx_ref
   * 2. Create PENDING transaction in DB
   * 3. Call Chapa initialize API
   * 4. Return checkout URL
   */
  async initializeDeposit(userId: string, amount: number) {
    // Generate a unique transaction reference
    const txRef = `KENO-${randomUUID()}`;

    // Save pending transaction BEFORE calling Chapa
    // This ensures we always have a record even if Chapa call fails
    const transaction = await paymentRepository.createTransaction({
      userId,
      txRef,
      amount,
      currency: "ETB",
      type: "DEPOSIT",
    });

    try {
      // Get user info for Chapa
      const { prisma } = await import("@/lib/db/prisma");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });

      // Call Chapa initialize API
      const chapaResponse = await chapaService.initialize({
        amount: amount.toFixed(2),
        currency: "ETB",
        phone_number: user?.phone || "",
        tx_ref: txRef,
        callback_url: `${BASE_URL}/api/payments/chapa/webhook`,
        return_url: `${BASE_URL}/?deposit=success&tx_ref=${txRef}`,
        customization: {
          title: "KENO80 Deposit",
          description: `Deposit ${amount} ETB to your KENO80 wallet`,
        },
      });

      return {
        checkoutUrl: chapaResponse.data.checkout_url,
        txRef: transaction.txRef,
        transactionId: transaction.id,
      };
    } catch (error) {
      // Mark transaction as failed if Chapa initialization fails
      await paymentRepository.failTransaction(txRef);

      if (error instanceof ChapaError) {
        throw new PaymentError(
          `Payment initialization failed: ${error.message}`,
          error.statusCode
        );
      }
      throw error;
    }
  },

  /**
   * Process a webhook notification from Chapa.
   *
   * CRITICAL SECURITY:
   * 1. Verify webhook signature
   * 2. Verify transaction via Chapa API (never trust webhook data alone)
   * 3. Use idempotent DB update (prevents double crediting)
   */
  async processWebhook(
    signature: string | null,
    body: string,
    payload: { tx_ref: string; status: string }
  ) {
    // Step 1: Verify webhook signature
    const isValid = chapaService.verifyWebhookSignature(signature);
    if (!isValid) {
      throw new PaymentError("Invalid webhook signature", 403);
    }

    const { tx_ref } = payload;

    // Step 2: Check if transaction exists in our DB
    const transaction = await paymentRepository.findByTxRef(tx_ref);
    if (!transaction) {
      console.warn(`⚠️ Webhook received for unknown tx_ref: ${tx_ref}`);
      throw new PaymentError("Transaction not found", 404);
    }

    // IDEMPOTENCY: Skip if already processed
    if (transaction.status !== "PENDING") {
      console.log(
        `⚠️ Transaction ${tx_ref} already in status ${transaction.status}. Skipping webhook.`
      );
      return { status: transaction.status, message: "Already processed" };
    }

    // Step 3: ALWAYS verify with Chapa API — never trust webhook payload alone
    try {
      const verification = await chapaService.verify(tx_ref);

      if (
        verification.status === "success" &&
        verification.data.status === "success"
      ) {
        // Payment confirmed — credit balance atomically
        await paymentRepository.completeTransaction(
          tx_ref,
          verification.data.reference || ""
        );
        return { status: "SUCCESS", message: "Payment processed successfully" };
      } else {
        // Payment failed or pending
        await paymentRepository.failTransaction(tx_ref);
        return { status: "FAILED", message: "Payment verification failed" };
      }
    } catch (error) {
      console.error(`❌ Verification failed for ${tx_ref}:`, error);
      // Don't mark as failed on network errors — allow retry
      if (error instanceof ChapaError && error.statusCode >= 500) {
        throw new PaymentError(
          "Chapa verification temporarily unavailable",
          503
        );
      }
      await paymentRepository.failTransaction(tx_ref);
      return { status: "FAILED", message: "Verification error" };
    }
  },

  /**
   * Manually verify and sync a transaction status.
   * Used as a fallback when webhook doesn't arrive.
   */
  async verifyAndSync(txRef: string) {
    const transaction = await paymentRepository.findByTxRef(txRef);
    if (!transaction) {
      throw new PaymentError("Transaction not found", 404);
    }

    // If already completed, just return current status
    if (transaction.status === "SUCCESS") {
      return {
        status: "SUCCESS",
        message: "Transaction already completed",
        amount: transaction.amount,
      };
    }

    // Verify with Chapa
    try {
      const verification = await chapaService.verify(txRef);

      if (
        verification.status === "success" &&
        verification.data.status === "success"
      ) {
        // Complete the transaction
        const updated = await paymentRepository.completeTransaction(
          txRef,
          verification.data.reference || ""
        );
        return {
          status: "SUCCESS",
          message: "Payment verified and balance updated",
          amount: updated.amount,
        };
      } else {
        return {
          status: verification.data?.status || "PENDING",
          message: "Payment not yet confirmed",
          amount: transaction.amount,
        };
      }
    } catch (error) {
      if (error instanceof ChapaError) {
        throw new PaymentError(
          `Verification failed: ${error.message}`,
          error.statusCode
        );
      }
      throw error;
    }
  },

  /** Get a user's transaction history */
  async getTransactionHistory(userId: string) {
    return paymentRepository.getUserTransactions(userId);
  },
};

export { PaymentError };
