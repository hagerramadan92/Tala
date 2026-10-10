"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type SliderResponse = any;

const DEFAULT_SLIDER_IMAGE = "/images/home-default-hero.webp";

export default function SliderComponent({ src }: { src: SliderResponse | null }) {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const items = useMemo(() => {
    const list = src?.items ?? [];
    return list
      .filter((it: any) => it?.is_active !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [src]);

  const hasSlides = items.length > 0;
  const showNav = items.length > 1;
  const showPagination = items.length > 1;

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !showNav) return;

    if (prevRef.current && nextRef.current) {
      // Assign custom navigation elements
      // @ts-ignore
      swiper.params.navigation.prevEl = prevRef.current;
      // @ts-ignore
      swiper.params.navigation.nextEl = nextRef.current;
      
      // Re-init navigation
      swiper.navigation?.destroy();
      swiper.navigation?.init();
      swiper.navigation?.update();
    }
  }, [showNav]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !showPagination) return;

    if (paginationRef.current) {
      // @ts-ignore
      swiper.params.pagination.el = paginationRef.current;
      // @ts-ignore
      swiper.params.pagination.clickable = true;
      // @ts-ignore
      swiper.params.pagination.renderBullet = function (index, className) {
        return `<span class="${className} w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/70 inline-block mx-1 transition-all duration-300"></span>`;
      };
      swiper.pagination?.destroy();
      swiper.pagination?.init();
      swiper.pagination?.render();
      swiper.pagination?.update();
    }
  }, [showPagination]);

  if (!hasSlides) return null;

  return (
    <div className="relative w-full h-[216px] sm:h-[306px] md:h-[450px] lg:h-[486px] group rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={18}
        slidesPerView={1}
        loop={items.length > 1}
        autoplay={items.length > 1 ? { delay: 2800, disableOnInteraction: false } : false}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        navigation={false}
        pagination={false}
        className="w-full h-full"
      >
        {items.map((item: any, index: number) => {
          const href = item.url || item.link_url || "#";
          const target = item.link_target || (href.startsWith("http") ? "_blank" : "_self");
          const imageSrc = item.mobile_image || item.image || DEFAULT_SLIDER_IMAGE;
          const alt = item.alt || `Slide ${index + 1}`;

          return (
            <SwiperSlide key={item.id ?? index}>
              <div className="relative w-full h-[216px] sm:h-[306px] md:h-[450px] lg:h-[486px] overflow-hidden">
                <Link href={href} target={target} aria-label={`Go to slide ${index + 1}`}>
                  <img
                    src={imageSrc}
                    alt={alt}
                    className="object-cover w-full h-full"
                    loading={index === 0 ? "eager" : "lazy"}
                    // @ts-ignore
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding={index === 0 ? "sync" : "async"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                </Link>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Navigation buttons */}
      {showNav && (
        <>
          <button
            ref={prevRef}
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
            ref={nextRef}
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
        <div
          ref={paginationRef}
          className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 
                   flex items-center justify-center gap-1.5 md:gap-2 z-20"
        />
      )}
    </div>
  );
}
