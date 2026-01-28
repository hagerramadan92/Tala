"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { FaFacebook, FaPhoneAlt } from "react-icons/fa";

import SubIcon from "./subIcon";
import { link } from "@/Types/data";
import { useAppContext } from "@/src/context/AppContext";

export default function LangNavbar() {
  const pathname = usePathname();

  const links = link;
  const { socialMedia } = useAppContext();
  
    const social_Media = socialMedia;

  return (
    <div className="flex justify-between container py-2 bg-[#f0f0f0] text-[0.9rem]">
      <div className="hidden1  gap-5">
        {links.map((link, index) => {
          const isActive = pathname === link.href;
          return (
            <div
              key={index}
              className={`${
                isActive ? "text-pro" : "text-black text-pro-hover"
              } transition-colors duration-200`}
            >
              <Link href={link.href}>{link.title}</Link>
            </div>
          );
        })}
      
      </div>
      <div className="flex1 justify-between">
        <div className="flex items-center gap-2">
          <FaPhoneAlt size={17} strokeWidth={1.3}/>
          <p>{social_Media?.[0]?.value|| '98098'}</p>
        </div>
      </div>
      <div className="flex gap-6">
        <SubIcon className="flex1 gap-3"/>
        <p className="text-end text-gray-500">عربي</p>
      </div>
    </div>
  );
}
