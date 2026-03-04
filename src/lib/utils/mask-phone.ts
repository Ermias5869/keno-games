/** Phone masking helper for server.ts */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  // +251912345678 → f***x style  (first char + *** + last char)
  return phone[0] + "***" + phone[phone.length - 1];
}
