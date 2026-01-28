"use client";

import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BlogCard, { Article } from "./BlogCard";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function BlogSlider({
  articles,
  isLoading = false,
  className = "",
}: {
  articles: Article[];
  isLoading?: boolean;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const canShow = Array.isArray(articles) && articles.length > 0;

  const itemClass = useMemo(
    () =>
      cn(
        "shrink-0 snap-start",
        "w-[80%] sm:w-[55%] md:w-[38%] lg:w-[28%] xl:w-[22%]"
      ),
    []
  );

  const scrollByOne = (dir: "next" | "prev") => {
    const el = scrollerRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-blog-card='1']");
    const step = card ? card.offsetWidth + 16 : Math.round(el.clientWidth * 0.8);

    const delta = dir === "next" ? step : -step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      {/* Arrows */}
      <div className="absolute -top-12 left-0 flex items-center gap-2">
        <button
          type="button"
          aria-label="السابق"
          onClick={() => scrollByOne("prev")}
          className="h-10 w-10 grid place-items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm"
        >
          <ChevronRight size={18} />
        </button>

        <button
          type="button"
          aria-label="التالي"
          onClick={() => scrollByOne("next")}
          className="h-10 w-10 grid place-items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Track */}
      <div
        ref={scrollerRef}
        className={cn(
          "mt-4 flex gap-4 overflow-x-auto pb-3",
          "snap-x snap-mandatory scroll-smooth",
          "[scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden"
        )}
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                itemClass,
                "rounded-3xl border border-slate-100 bg-slate-100 animate-pulse h-[320px]"
              )}
            />
          ))
        ) : !canShow ? (
          <div className="w-full rounded-3xl border border-slate-100 bg-slate-50 p-6 text-sm font-bold text-slate-600">
            لا توجد مقالات حالياً.
          </div>
        ) : (
          articles.map((a) => (
            <div key={a.id} className={itemClass} data-blog-card="1">
              <BlogCard article={a} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
