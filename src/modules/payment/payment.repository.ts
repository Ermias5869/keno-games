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

  /** 
   * Create a withdrawal request:
   * 1. Check if user has enough balance
   * 2. Deduct balance immediately
   * 3. Create a PENDING transaction
   */
  async createWithdrawRequest(data: {
    userId: string;
    txRef: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { balance: true }
      });

      if (!user || user.balance.lt(data.amount)) {
        throw new PaymentError("Insufficient balance", 400);
      }

      // Deduct balance
      await tx.user.update({
        where: { id: data.userId },
        data: {
          balance: { decrement: data.amount },
        },
      });

      // Create transaction record
      return tx.transaction.create({
        data: {
          userId: data.userId,
          txRef: data.txRef,
          amount: new Decimal(data.amount),
          type: "WITHDRAW",
          status: "PENDING",
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
        },
      });
    });
  },

  /** Complete a withdrawal successfully */
  async completeWithdraw(txRef: string, chapaTxId: string) {
    return prisma.transaction.update({
      where: { txRef },
      data: {
        status: "SUCCESS" as TransactionStatus,
        chapaTxId,
      },
    });
  },

  /** 
   * Fail a withdrawal request:
   * 1. Mark transaction as FAILED
   * 2. Refund user balance
   */
  async failWithdraw(txRef: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { txRef },
      });

      if (!transaction || transaction.status !== "PENDING" || transaction.type !== "WITHDRAW") {
        return;
      }

      // Update status
      await tx.transaction.update({
        where: { txRef },
        data: { status: "FAILED" as TransactionStatus },
      });

      // Refund balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          balance: { increment: transaction.amount },
        },
      });
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
