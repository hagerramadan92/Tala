import Image from "next/image";
import Link from "next/link";
interface DiscountProps {
  src: string;
  href: string;
}
export default function Discount({ src, href }:DiscountProps) {
  return (
    <div className="rounded">
      <Link href={href} aria-label={`go to ${href}`}>
        <Image
          src={src}
          alt="Slide discount"
          width={1200}
          height={300}
          className="object-cover rounded-2xl w-full h-40"
          loading="lazy"
          decoding="async"
        />
      </Link>
    </div>
  );
}
