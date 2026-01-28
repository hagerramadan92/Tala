"use client";
import { useState, useEffect, useRef } from "react";
import { GoShieldCheck } from "react-icons/go";
import { IoIosArrowDown } from "react-icons/io";
import { PiTruckLight } from "react-icons/pi";

export default function FreeDeliver() {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPopup) {
      timer = setTimeout(() => setShowPopup(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [showPopup]);

  return (
    <div className="flex gap-2 text-pro mt-5 relative">
      <div
        ref={buttonRef}
        className="flex items-center bg-[#ecf1fe] rounded-md p-1 ps-1 cursor-pointer select-none"
        onClick={() => setShowPopup(!showPopup)}
      >
        <PiTruckLight className="h-5 w-6 text-gray-700 me-1" />
        <p className="text-[14px] font-bold mb-1">شحن مجاني</p>
        <IoIosArrowDown
          className={`h-4 w-6 text-gray-500 transition-transform duration-200 ${
            showPopup ? "rotate-180" : ""
          }`}
        />
      </div>

      <div className="flex gap-1 items-center bg-[#ecf1fe] rounded-md p-1 pe-2">
        <GoShieldCheck className="h-4 w-6 text-gray-600" />
        <p className="text-[14px] font-bold mb-1">ضمان سنة</p>
      </div>

      {showPopup && (
        <div
          ref={popupRef}
          className="p-3 py-2 border border-gray-200 shadow-xl rounded-xl absolute bg-white top-9 start-0 w-80 z-50 animate-fadeInDown"
        >
          <h4 className="text-pro text-[15px] font-bold">شحن مجاني</h4>
          <p className="text-[13px] text-[#555] font-semibold py-1.5">
            مبروك! لقد حصلت على شحن مجاني لهذا المنتج إلى القاهرة والجيزة
          </p>
        </div>
      )}
    </div>
  );
}
