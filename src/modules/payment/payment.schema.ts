import { z } from "zod";

const MIN_DEPOSIT = 10; // Minimum 10 ETB
const MAX_DEPOSIT = 100000; // Maximum 100,000 ETB

export const InitializePaymentSchema = z.object({
  amount: z
    .number()
    .min(MIN_DEPOSIT, `Minimum deposit is ${MIN_DEPOSIT} ETB`)
    .max(MAX_DEPOSIT, `Maximum deposit is ${MAX_DEPOSIT} ETB`),
});

export const VerifyPaymentSchema = z.object({
  tx_ref: z.string().min(1, "Transaction reference is required"),
});

export type InitializePaymentInput = z.infer<typeof InitializePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
