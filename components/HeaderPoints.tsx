"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaCoins } from "react-icons/fa";
import { useAuth } from "@/src/context/AuthContext";

/**
 * Small header badge showing the signed-in customer's loyalty balance.
 * Refreshes when the tab regains focus so it stays in sync after checkout.
 */
export default function HeaderPoints() {
  const { authToken } = useAuth() as any;
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!authToken) {
      setPoints(null);
      return;
    }

    let alive = true;

    const load = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((json) => {
          if (alive && json?.status !== false) {
            setPoints(Number(json?.data?.balance ?? 0));
          }
        })
        .catch(() => {});
    };

    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [authToken]);

  if (!authToken || points === null) return null;

  return (
    <Link
      href="/myAccount/points"
      aria-label="نقاطي"
      title="نقاطي"
      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800 transition hover:bg-amber-100"
    >
      <FaCoins className="text-amber-500" size={14} />
      <span className="text-xs font-extrabold tabular-nums">
        {points.toLocaleString("en-US")}
      </span>
      <span className="hidden text-[10px] font-bold text-amber-700 sm:inline">
        نقطة
      </span>
    </Link>
  );
}
