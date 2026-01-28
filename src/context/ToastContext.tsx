"use client";
import { createContext, useContext, ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; 

interface ToastData {
  msg: string;
  img?: string;
  type: "success" | "error" | "warning";
}

interface ToastContextType {
  toast: ToastData | null;
  showToast: (t: ToastData) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (t: ToastData) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000); 
  };

  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }} >
      {children}

  
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-5 right-5 z-9999! px-4 py-2 rounded shadow-lg text-white ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
                : "bg-yellow-500"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};
