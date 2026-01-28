
    "use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  img?: string;
  type?: "success" | "warning" | "error";
  duration?: number;
}

export default function Toast({ message, img, type = "success", duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`fixed py-6 top-6 right-6 z-50 flex items-center gap-3 px-5 rounded-xl shadow-lg  backdrop-blur-md
            ${
              type === "success"
                ? "bg-[#eefaf6]  text-[#212830]"
                : type === "warning"
                ? "bg-[#faf7ee]  text-[#362b24]"
                : "bg-red-50/90  text-red-800"
            }`}
        >
          {img && (
            <Image
              src={img}
              alt="toast icon"
              width={40}
              height={40}
              className="rounded-full object-cover border border-gray-200"
            />
          )}
          <p className="text-sm font-medium">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

    