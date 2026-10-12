"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
	href?: string;
	size?: number; // logo size in px
	showTagline?: boolean;
	className?: string;
};

export default function Logo({
	href = "/",
	size = 44, 
	className = "",
}: Props) {
	return (
		<Link
			href={href}
			className={`inline-flex items-center gap-2 select-none ${className}`}
			aria-label="Tala AlJazeera"
		>
			{/* Logo */}
			<div className="relative">
				{/* soft glow */}
				<div className="relative  ">
					<Image
						src="/logo/Logo.png"
						alt="Tala AlJazeera Logo"
						width={size}
						height={size}
						className="object-contain max-md:w-[35px] w-[44px] h-auto"
						priority
					/>
				</div>
			</div>

			{/* Names */}
			<div className="flex flex-col leading-tight">
				<div className="flex flex-col items-baseline">
					<span className="font-ar  ml-auto font-extrabold text-slate-900 max-md:text-base text-lg">
						تالا الجزيره
					</span>

					<span className=" mt-[-3px] font-en font-bold text-slate-500 text-sm max-md:text-xs tracking-wide">
						Tala AlJazeera
					</span>
				</div>
			</div>
		</Link>
	);
}
