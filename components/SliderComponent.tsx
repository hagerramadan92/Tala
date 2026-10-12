"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BannerI, ItemsI } from "@/Types/BannerI";

type SliderItem = ItemsI & { url?: string };

const DEFAULT_SLIDER_IMAGE = "/images/home-default-hero.webp";

export default function SliderComponent({ src }: { src: BannerI | null }) {
  const items = useMemo(() => {
    const list: SliderItem[] = src?.items ?? [];
    return list
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [src]);

  const hasSlides = items.length > 0;
  const showNav = items.length > 1;
  const showPagination = items.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!showNav) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items.length, showNav]);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }, [items.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % items.length);
  }, [items.length]);

  if (!hasSlides) return null;

  return (
    <div className="relative w-full h-[216px] sm:h-[306px] md:h-[450px] lg:h-[486px] group rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
      <div className="relative w-full h-full">
        {items.map((item, index) => {
          const href = item.url || item.link_url || "#";
          const target = item.link_target || (href.startsWith("http") ? "_blank" : "_self");
          const desktopImage = item.desktop_image || item.image || item.mobile_image || DEFAULT_SLIDER_IMAGE;
          const mobileImage = item.mobile_image || desktopImage;
          const alt = item.alt || `Slide ${index + 1}`;

          return (
            <div
              key={item.id ?? index}
              aria-hidden={activeIndex !== index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeIndex === index ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
              }`}
            >
              <div className="relative w-full h-[216px] sm:h-[306px] md:h-[450px] lg:h-[486px] overflow-hidden">
                <Link href={href} target={target} aria-label={`Go to slide ${index + 1}`} className="w-full h-full block">
                  <picture className="w-full h-full block">
                    {mobileImage && mobileImage !== desktopImage && (
                      <source media="(max-width: 767px)" srcSet={mobileImage} />
                    )}
                    <img
                      src={desktopImage}
                      alt={alt}
                      className="object-cover w-full h-full"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding={index === 0 ? "sync" : "async"}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_SLIDER_IMAGE;
                      }}
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent pointer-events-none" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      {showNav && (
        <>
          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 
                     w-9 h-9 md:w-11 md:h-11 rounded-full 
                     bg-white/90 backdrop-blur-sm
                     border border-slate-200
                     shadow-sm
                     flex items-center justify-center
                     transition-all duration-200 
                     hover:bg-pro hover:text-white hover:border-pro
                     active:scale-95 text-slate-800"
            aria-label="Previous slide"
          >
            <svg 
              className="w-4 h-4 md:w-5 md:h-5 text-current" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20
                     w-9 h-9 md:w-11 md:h-11 rounded-full
                     bg-white/90 backdrop-blur-sm
                     border border-slate-200
                     shadow-sm
                     flex items-center justify-center
                     transition-all duration-200
                     hover:bg-pro hover:text-white hover:border-pro
                     active:scale-95 text-slate-800"
            aria-label="Next slide"
          >
            <svg 
              className="w-4 h-4 md:w-5 md:h-5 text-current" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Pagination dots */}
      {showPagination && (
        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 md:gap-2 z-20">
          {items.map((item, index) => (
            <button
              type="button"
              key={item.id ?? index}
              onClick={() => setActiveIndex(index)}
              aria-label={`انتقل إلى الشريحة ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-2.5 md:h-3 rounded-full transition-all ${
                activeIndex === index ? "w-7 bg-white" : "w-2.5 md:w-3 bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
