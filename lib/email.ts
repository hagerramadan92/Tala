/** إيميلات مولّدة تلقائيًا لحسابات OTP (مش إيميل حقيقي للمستخدم) */
export function isSyntheticEmail(email?: string | null): boolean {
  if (!email) return false;
  return /@otp\.tala\.local$/i.test(String(email).trim());
}

export function visibleEmail(email?: string | null): string {
  return isSyntheticEmail(email) ? "" : String(email || "");
}
