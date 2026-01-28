"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdStars } from "react-icons/md";
import { PiTruckLight } from "react-icons/pi";
import { FaGift, FaHeart } from "react-icons/fa";

type TextAd = {
  id: number;
  name: string;
  icon?: string;
};

type Props = {
  text_ads?: TextAd[];
};

/* -------- Icon Mapper -------- */
function mapIcon(icon?: string) {
  switch (icon) {
    case "fa-gift":
      return <FaGift size={16} />;
    case "fa-heart":
      return <FaHeart size={16} className="text-red-500" />;
    case "fa-truck":
      return <PiTruckLight size={16} />;
    case "fa-stars":
      return <MdStars size={16} />;
    default:
      return <MdStars size={16} />;
  }
}

export default function BottomSlider({ text_ads }: Props) {
  /* -------- Safe Items -------- */
  const items = useMemo(() => {
    if (!Array.isArray(text_ads) || text_ads.length === 0) {
      return [];
    }

    return text_ads.map((ad) => ({
      id: ad.id,
      icon: mapIcon(ad.icon),
      text: ad.name,
    }));
  }, [text_ads]);

  const [index, setIndex] = useState(0);

  /* -------- Auto change -------- */
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [items.length]);

  /* -------- Nothing to show -------- */
  if (items.length === 0) return null;

  return (
    <div className="flex h-5 items-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={items[index].id}
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {items[index].icon}
          <p className="line-clamp-1 text-xs text-gray-700">
            {items[index].text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
