import { prisma } from "@/lib/db/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { TransactionStatus } from "./types";

/**
 * PaymentRepository — all database operations for transactions.
 * Uses Prisma transactions for atomic balance updates.
 */
export const paymentRepository = {
  /** Create a new pending transaction */
  async createTransaction(data: {
    userId: string;
    txRef: string;
    amount: number;
    currency?: string;
    type?: string;
  }) {
    return prisma.transaction.create({
      data: {
        userId: data.userId,
        txRef: data.txRef,
        amount: new Decimal(data.amount),
        currency: data.currency || "ETB",
        type: data.type || "DEPOSIT",
        status: "PENDING",
      },
    });
  },

  /** Find a transaction by tx_ref */
  async findByTxRef(txRef: string) {
    return prisma.transaction.findUnique({
      where: { txRef },
    });
  },

  /** Find a transaction by ID */
  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
    });
  },

  /**
   * Complete a successful transaction atomically:
   * 1. Update transaction status to SUCCESS
   * 2. Set chapaTxId from Chapa response
   * 3. Increment user balance
   *
   * CRITICAL: Uses Prisma $transaction to ensure atomicity.
   * The idempotency check (status !== PENDING) prevents double crediting.
   */
  async completeTransaction(txRef: string, chapaTxId: string) {
    return prisma.$transaction(async (tx) => {
      // Fetch the transaction within the transaction context
      const transaction = await tx.transaction.findUnique({
        where: { txRef },
      });

      if (!transaction) {
        throw new PaymentError("Transaction not found", 404);
      }

      // IDEMPOTENCY GUARD: Only process PENDING transactions
      // If already SUCCESS or FAILED, return without double-processing
      if (transaction.status !== "PENDING") {
        console.log(
          `⚠️ Transaction ${txRef} already processed (status: ${transaction.status}). Skipping.`
        );
        return transaction;
      }

      // Update transaction to SUCCESS
      const updated = await tx.transaction.update({
        where: { txRef },
        data: {
          status: "SUCCESS" as TransactionStatus,
          chapaTxId,
        },
      });

      // Credit user balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          balance: { increment: transaction.amount },
        },
      });

      console.log(
        `✅ Transaction ${txRef} completed: +${transaction.amount} ETB for user ${transaction.userId}`
      );

      return updated;
    });
  },

  /** Mark a transaction as failed */
  async failTransaction(txRef: string) {
    return prisma.transaction.update({
      where: { txRef },
      data: { status: "FAILED" as TransactionStatus },
    });
  },

  /** Get user's transaction history */
  async getUserTransactions(userId: string, limit = 50) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};

/** Custom error class for payment errors */
export class PaymentError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
