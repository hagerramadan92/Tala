"use client";
import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SelectBoxProps {
  title: string;
  children: ReactNode; 
}

export default function SelectBoxComponent({ title, children }: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto mt-3 ">
      <button
      aria-label="select one"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between transition cursor-pointer"
      >
        <span className="font-semibold text-gray-900 text-[1rem]">{title}</span>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>

      <div
        className={` transition-all duration-150 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="bg-white text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}
