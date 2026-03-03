import { z } from "zod";

const MIN_BET = Number(process.env.MIN_BET) || 1;
const MAX_BET = Number(process.env.MAX_BET) || 10000;

export const PlaceBetSchema = z.object({
  selectedNumbers: z
    .array(z.number().int().min(1).max(80))
    .min(1, "Select at least 1 number")
    .max(10, "Select at most 10 numbers")
    .refine(
      (nums) => new Set(nums).size === nums.length,
      "Numbers must be unique"
    ),
  betAmount: z
    .number()
    .min(MIN_BET, `Minimum bet is ${MIN_BET}`)
    .max(MAX_BET, `Maximum bet is ${MAX_BET}`),
  roundId: z.string().min(1, "Round ID is required"),
});

export type PlaceBetInput = z.infer<typeof PlaceBetSchema>;
