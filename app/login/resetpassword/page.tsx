"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * تم إيقاف استعادة كلمة المرور لأن تسجيل الدخول أصبح برقم الجوال ورمز واتساب فقط.
 */
export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}
