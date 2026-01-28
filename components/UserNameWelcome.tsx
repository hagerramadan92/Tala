"use client";

import { useAuth } from "@/src/context/AuthContext";
import { motion } from "framer-motion";
 
export default function UserNameWelcome() {
	const { userName } = useAuth();

	return (
		<motion.div
			dir="rtl"
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: "easeOut" }}
			className="flex items-center gap-2"
		>
			{/* Icon */}
			<motion.span
				initial={{ rotate: -12 }}
				animate={{ rotate: 0 }}
				transition={{ type: "spring", stiffness: 300, damping: 18 }}
				className="text-2xl"
			>
				👋
			</motion.span>

			{/* Text */}
			<p className="text-sm md:text-base font-semibold text-slate-700">
				مرحباً
				{userName ? (
					<span className="mx-1 font-extrabold text-pro">
						{userName}
					</span>
				) : (
					<span className="inline-block mx-2 h-4 w-24 rounded-full bg-slate-200 animate-pulse align-middle" />
				)}
				، كيف يمكننا مساعدتك؟
			</p>
		</motion.div>
	);
}
