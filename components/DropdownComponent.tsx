"use client";
import { useState, useEffect, useRef, ReactNode } from "react";

interface Category {
  title: string;
}

interface Props {
  categories: Category[];
  trigger: ReactNode;
}

export default function CategoriesDropdown({ categories, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    if (open) {
      setClosing(true);
      setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 250);
    } else {
      setOpen(true);
    }
  };

 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (open) toggleDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
    
      <div onClick={toggleDropdown} className="cursor-pointer select-none">
        {trigger}
      </div>

      {open && (
        <div
          className={`absolute top-10 w-60 end-1 border shadow bg-white p-4 pt-1 border-gray-300 z-40 rounded
          transition-all duration-300 ease-out
          ${closing ? "animate-slideUp" : "animate-slideDown"}`}
        >
          {categories.map((cate, index) => (
            <p
              key={index}
              className="mt-3 cursor-pointer text-pro-hover transition-colors"
            >
              {cate.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
