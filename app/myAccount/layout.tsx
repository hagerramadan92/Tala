"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SideBar from "@/components/SideBar";


export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname.split("/").pop() || "account";

  return (
    <div className="container  flex gap-4 py-6  min-h-[50vh]">
 
      <div className=" h-fit sticky top-[160px] max-lg:hidden max-w-[300px] w-full ">
        <SideBar active={active} />
      </div>

      <div className="w-full  w-full transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
