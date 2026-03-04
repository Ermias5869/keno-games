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
    const txRef = `SyntaxKeno-${randomUUID()}`;

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
          title: "SyntaxKeno Deposit",
          description: `Deposit ${amount} ETB to your SyntaxKeno wallet`,
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

  /**
   * Request a withdrawal.
   * 1. Create PENDING withdrawal in DB (deducts balance)
   * 2. Call Chapa transfer API (if auto-process is enabled)
   * 3. Update status based on Chapa response
   */
  async requestWithdraw(data: {
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  }) {
    const txRef = `SyntaxWithdraw-${randomUUID()}`;

    // Create record and deduct balance
    const transaction = await paymentRepository.createWithdrawRequest({
      userId: data.userId,
      txRef,
      amount: data.amount,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
    });

    try {
      // Call Chapa transfer API
      // Note: In some setups, withdrawals might be manual. 
      // Here we attempt auto-transfer via Chapa.
      const chapaResponse = await chapaService.transfer({
        amount: data.amount,
        currency: "ETB",
        beneficiary_name: data.accountName,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        reference: txRef,
      });

      if (chapaResponse.status === "success") {
        await paymentRepository.completeWithdraw(txRef, (chapaResponse.data as { id: string })?.id || "manual");
        return { status: "SUCCESS", message: "Withdrawal processed successfully" };
      } else {
        // This part might vary depending on Chapa API behavior
        return { status: "PENDING", message: "Withdrawal is being processed" };
      }
    } catch (error) {
      console.error("❌ Withdrawal transfer failed:", error);
      // We DON'T fail the transaction automatically here because 
      // Chapa might have received it but returned an error.
      // Usually, withdrawals should be reviewed if auto-transfer fails.
      return { 
        status: "PENDING", 
        message: "Request received. If auto-transfer fails, an admin will process it manually.",
        txRef
      };
    }
  },
};

export { PaymentError };
