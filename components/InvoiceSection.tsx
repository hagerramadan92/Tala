"use client";

import { useState } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

export default function InvoiceSection() {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      {/* clickable header */}
      <div
        className="flex items-center justify-between cursor-pointer show-bell"
        onClick={() => setShow(!show)}
      >
        <div className="flex gap-1 items-center py-4">
          <HiOutlineInformationCircle size={22} />
          <h4 className="font-bold text-xl">
            هل تحتاج إلى فاتورة ضريبية لطلبك ؟
          </h4>
        </div>
        <MdOutlineKeyboardArrowDown
          size={22}
          className={`text-gray-400 transition-transform duration-300 ${
            show ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>

      {/* animated paragraph */}
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-sm text-gray-500 overflow-hidden"
          >
            إذا كنت بحاجة إلى فاتورة ضريبية يرجى التأكد من أن الاسم المسجل في
            حسابك (داخل صفحة حسابي) يطابق الاسم الموجود في بطاقة الرقم القومي
            الخاصة بك قبل إتمام الطلب.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
