"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Keeps the current listing page in the URL (?page=N).
 *
 * Without this, opening a product from page 4/5 and pressing the browser
 * back button remounted the listing with its default state (page 1).
 * Reading the page from the URL restores the exact page on back/forward.
 */
export function usePageParam(): [number, Dispatch<SetStateAction<number>>] {
  const [page, setPage] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const value = Number(new URLSearchParams(window.location.search).get("page"));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url.toString());
  }, [page]);

  return [page, setPage];
}
