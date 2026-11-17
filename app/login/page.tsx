"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { openLoginModal } from "@/lib/openLogin";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    openLoginModal();
    router.replace("/");
  }, [router]);

  return null;
}
