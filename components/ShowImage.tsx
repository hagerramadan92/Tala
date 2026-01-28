"use client";

import Image from "next/image";
import { RiCloseLargeFill } from "react-icons/ri";

interface ShowImageProps {
  src?: string; 
  onClose: () => void;
}

export default function ShowImage({ src = "/images/o1.jpg", onClose }: ShowImageProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 "
      onClick={onClose}
    >
      <div
        className="relative rounded-lg p-4 w-[90%] h-[90%] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} 
      >
        
        <button
        aria-label="close"
          className="absolute top-2 right-2 cursor-pointer text-gray-300 hover:text-gray-50 bg-black/50 p-2"
          onClick={onClose}
        >
          <RiCloseLargeFill size={22} />
        </button>

        <Image
          src={src}
          alt="product"
          width={800}
          height={600}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}
