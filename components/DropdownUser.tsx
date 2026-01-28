"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import {
  FaHeart,
  FaQuestionCircle,
} from "react-icons/fa";
import {
  FaArrowRightFromBracket,
  FaClipboardCheck,
  FaMapLocationDot,
  FaUser,
} from "react-icons/fa6";
import Swal from "sweetalert2";
import { useAuth } from "@/src/context/AuthContext";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export default function DropdownUser() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { fullName, userImage, logout } = useAuth();
  const { data: session } = useSession();

  const displayName = useMemo(
    () => fullName || session?.user?.name || "مستخدم",
    [fullName, session?.user?.name]
  );

  const displayImage = useMemo(
    () => userImage || session?.user?.image || "/images/de_user.webp",
    [userImage, session?.user?.image]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleLinkClick = () => setOpen(false);

  const handleLogout = async () => {
    try {
      setOpen(false);
      logout?.();
      await nextAuthSignOut({ redirect: false });
      localStorage.removeItem("favorites");

      Swal.fire({
        icon: "success",
        title: "تم تسجيل الخروج",
        text: "تم تسجيل الخروج بنجاح!",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      console.error("Logout error:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "فشل تسجيل الخروج، حاول مرة أخرى",
        confirmButtonText: "حسنًا",
      });
    }
  };

  const items = [
    { href: "/myAccount", label: "حسابي", icon: <FaUser size={18} /> },
    { href: "/myAccount/orders", label: "طلباتي", icon: <FaClipboardCheck size={18} /> },
    { href: "/myAccount/favorites", label: "منتجاتي المفضلة", icon: <FaHeart size={16} /> },
    { href: "/myAccount/addresses", label: "إدارة العناوين", icon: <FaMapLocationDot size={18} /> },
    { href: "/myAccount/help", label: "مركز المساعدة", icon: <FaQuestionCircle size={18} /> },
  ];

  return (
    <div className="relative max-md:mt-[3px] " ref={menuRef} dir="rtl">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-3 md:rounded-xl md:border md:border-slate-200 md:bg-white/80 md:backdrop-blur md:px-3 md:py-2  md:hover:shadow-md md:hover:bg-white transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* avatar with ring + online dot */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 opacity-0 group-hover:opacity-100 transition" />
          <Image
            src={displayImage}
            alt="User"
            width={36}
            height={36}
            className="relative rounded-full object-cover border border-slate-200"
          />
          <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        {/* name */}
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-[10px] text-slate-500 font-semibold">أهلاً 👋</span>
          <span className="text-sm font-extrabold text-slate-900 truncate max-w-[140px]">
            {displayName}
          </span>
        </div>

        {/* chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-500 max-md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute end-0 mt-3 w-72 z-50"
          >
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {/* header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Image
                    src={displayImage}
                    alt="User"
                    width={44}
                    height={44}
                    className="rounded-2xl object-cover border border-slate-200 bg-white"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold truncate">
                      {session?.user?.email || "مرحبًا بك في تالا الجزيرة"}
                    </p>
                  </div>
                </div>
              </div>

              {/* links */}
              <div className="p-2">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={handleLinkClick}
                    className="group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 group-hover:scale-[1.02] transition">
                        {it.icon}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{it.label}</span>
                    </div>

                    <span className="scale-x-[-1] text-slate-300 group-hover:text-slate-400 transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                ))}

                {/* divider */}
                <div className="my-2 h-px bg-slate-200" />

                {/* logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 hover:bg-rose-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-2xl border border-rose-200 bg-white flex items-center justify-center text-rose-600">
                      <FaArrowRightFromBracket size={18} />
                    </span>
                    <span className="text-sm font-extrabold text-rose-700">تسجيل الخروج</span>
                  </div>

                  <span className="text-rose-300 scale-x-[-1] ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
