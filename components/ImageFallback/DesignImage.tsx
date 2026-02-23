// components/DesignImage.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DesignImageProps {
  src: string | null | undefined;
  alt: string;
  cartItemId: number;
  className?: string;
  onError?: (error: any) => void;
}

export default function DesignImage({ 
  src, 
  alt, 
  cartItemId, 
  className = "",
  onError 
}: DesignImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('/images/not.jpg');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (src) {
      // التحقق من صحة الرابط
      if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/')) {
        setImageSrc(src);
        setLoadError(false);
      } else {
        console.warn('رابط غير صالح للصورة:', src);
        setImageSrc('/images/not.jpg');
      }
    } else {
      setImageSrc('/images/not.jpg');
    }
  }, [src]);

  const handleError = () => {
    console.error(`فشل تحميل الصورة للمنتج رقم ${cartItemId}`);
    setLoadError(true);
    setImageSrc('/images/not.jpg');
    
    if (onError) {
      onError({ src, cartItemId });
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover"
        onError={handleError}
        unoptimized={imageSrc.startsWith('data:')}
        loading="lazy"
      />
      
      {loadError && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-500">⚠️</span>
        </div>
      )}
    </div>
  );
}