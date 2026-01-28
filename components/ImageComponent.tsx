import Image from "next/image";
import Link from "next/link";
interface ImgProp {
	image: string;
}
export default function ImageComponent({ image }: ImgProp) {
	return (
		<>

			<div className="relative w-full h-full ">
				<Image
					src={image}
					alt="صورة المنتج"
					width={600}
					height={400}
					className="object-cover h-full "
					loading="lazy"
					decoding="async"
				// sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
				/>
			</div>

		</>
	);
}
