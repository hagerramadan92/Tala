"use client";

import React, { ReactNode, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ButtonComponentProps {
  title: string | ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

  type?: "button" | "submit" | "reset";
  className?: string;

  /** لو عندك pending من الصفحة (أفضل) */
  loading?: boolean;

  disabled?: boolean;

  /** لو true يعمل ripple + micro loading تلقائي زي القديم */
  autoAnimateOnClick?: boolean;
}

export default function ButtonComponent({
  title,
  onClick,
  type = "button",
  className = "",
  loading,
  disabled,
  autoAnimateOnClick = true,
}: ButtonComponentProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const [localLoading, setLocalLoading] = useState(false);
  const [rippleStyle, setRippleStyle] = useState<React.CSSProperties>({});
  const [showRipple, setShowRipple] = useState(false);

  const isLoading = loading ?? localLoading;
  const isDisabled = disabled || isLoading;

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = btnRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    setRippleStyle({
      top: `${y}px`,
      left: `${x}px`,
      width: `${size}px`,
      height: `${size}px`,
    });

    setShowRipple(true);
    window.setTimeout(() => setShowRipple(false), 520);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    if (autoAnimateOnClick) {
      handleRipple(e);

      setLocalLoading(true);
      window.setTimeout(() => setLocalLoading(false), 650);
    }

    onClick?.(e);
  };

  const base =
    "relative w-full h-14 rounded-2xl overflow-hidden " +
    "flex items-center justify-center gap-2 px-6 " +
    "text-white font-extrabold " +
    "transition-all duration-300 " +
    "bg-pro hover:bg-pro-max " +
    "shadow-[0_10px_25px_rgba(0,0,0,0.12)] " +
    "focus:outline-none focus:ring-4 focus:ring-pro/20";

  const state =
    isDisabled
      ? "opacity-70 cursor-not-allowed shadow-none"
      : "cursor-pointer active:shadow-[0_6px_18px_rgba(0,0,0,0.12)]";

  return (
    <motion.button
      ref={btnRef}
      type={type}
      aria-label="button"
      disabled={isDisabled}
      onClick={handleClick}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      className={`${base} ${state} ${className}`}
    >
      {/* subtle gradient overlay */}
      <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />

      {/* shine sweep */}
      <span className="pointer-events-none absolute -inset-y-10 -left-20 w-16 rotate-12 bg-white/20 blur-md opacity-0 group-hover:opacity-100" />

      {/* ripple */}
      {showRipple && (
        <span
          style={rippleStyle}
          className="absolute rounded-full bg-white/25 pointer-events-none animate-[ripple_520ms_ease-out]"
        />
      )}

      {/* content */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
        </div>
      ) : (
        <span className="relative z-[1]">{title}</span>
      )}
    </motion.button>
  );
}
