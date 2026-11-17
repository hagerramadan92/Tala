"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { openLoginModal } from "@/lib/openLogin";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    openLoginModal();
    router.replace("/");
  }, [router]);

  return null;
}
