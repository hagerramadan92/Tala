'use client';

import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  fill,
  className,
  fallbackSrc = "/images/not.jpg"
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}