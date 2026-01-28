"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast2({ toast } :any) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
          className={`
            fixed top-6 right-6 z-50 
            shadow-lg p-4 rounded-xl min-w-[260px]
            flex items-center gap-3
            ${toast.type === "success" ? "bg-green-500 text-white" : ""}
            ${toast.type === "error" ? "bg-red-500 text-white" : ""}
          `}
        >
          {toast.img && (
            <img
              src={toast.img}
              className="w-12 h-12 rounded-md object-cover"
              alt="product"
            />
          )}

          <p className="font-semibold text-md">{toast.msg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
