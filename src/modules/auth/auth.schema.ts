import { z } from "zod";

/** Phone number validation — supports international formats */
const ethiopiaPhoneRegex = /^(?:\+2519\d{8}|09\d{8})$/;

export const RegisterSchema = z.object({
  phone: z
    .string()
    .regex(
      ethiopiaPhoneRegex,
      "Invalid Ethiopian phone number. Use +2519XXXXXXXX or 09XXXXXXXX format."
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const LoginSchema = z.object({
  phone: z
    .string()
    .regex(ethiopiaPhoneRegex, "Invalid Ethiopian phone number. Use +2519XXXXXXXX or 09XXXXXXXX format."),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const RefreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
