"use client";
import { useState, useRef, useEffect } from "react";
import { BiChevronDown } from "react-icons/bi";

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder = "اختر" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full md:w-40">
      {/* Button to toggle dropdown */}
      <button
        type="button"
        aria-label="open box"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white flex justify-between items-center text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || placeholder}
        <BiChevronDown className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <ul className="absolute w-full bg-white border border-gray-300 rounded-lg mt-1 min-h-48 overflow-auto shadow-lg z-50">
          {options.map((opt) => (
            <li
              key={opt}
              className={`px-4 py-2 text-center cursor-pointer hover:bg-blue-100 ${opt === value ? "bg-blue-50 font-semibold" : ""}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
