"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HiMiniHeart, HiOutlineHeart } from "react-icons/hi2";

interface HearComponentProps {
	liked: boolean;
	onToggleLike: () => void;
	ClassName?: string;
	ClassNameP?: string;
}

const pop = {
	initial: { scale: 0.6, rotate: -12, opacity: 0 },
	animate: { scale: 1, rotate: 0, opacity: 1 },
	exit: { scale: 0.6, rotate: 12, opacity: 0 },
};

export default function HearComponent({
	liked,
	onToggleLike,
	ClassName = "text-slate-600",
	ClassNameP = "",
}: HearComponentProps) {
	return (
		<motion.button
			type="button"
			aria-label={liked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onToggleLike();
			}}
			whileHover={{ scale: 1.08 }}
			whileTap={{ scale: 0.92 }}
			className={[
				"relative grid place-items-center",
				"w-8 h-8 md:w-11 md:h-11 rounded-full",
				"bg-white/90 backdrop-blur border border-slate-200",
				"shadow-sm ring-1 ring-black/5",
				"transition-colors",
				ClassNameP,
			].join(" ")}
		>
			{/* Burst particles only when liked */}
			<AnimatePresence>
				{liked && (
					<motion.span
						key="burst"
						className="pointer-events-none absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						{Array.from({ length: 6 }).map((_, i) => {
							const angle = (i * 360) / 6;
							return (
								<motion.i
									key={i}
									className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-pro"
									style={{ transform: "translate(-50%, -50%)" }}
									initial={{ scale: 0, opacity: 0 }}
									animate={{
										scale: [0, 1, 0.6],
										opacity: [0, 1, 0],
										x: [0, Math.cos((angle * Math.PI) / 180) * 16],
										y: [0, Math.sin((angle * Math.PI) / 180) * 16],
									}}
									transition={{ duration: 0.45, ease: "easeOut" }}
								/>
							);
						})}
					</motion.span>
				)}
			</AnimatePresence>

			{/* Soft pulse ring when liked */}
			<AnimatePresence>
				{liked && (
					<motion.span
						key="ring"
						className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-pro/40"
						initial={{ scale: 0.75, opacity: 0 }}
						animate={{ scale: 1.25, opacity: [0.35, 0] }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5, ease: "easeOut" }}
					/>
				)}
			</AnimatePresence>

			{/* Icon swap */}
			<AnimatePresence mode="popLayout" initial={false}>
				{liked ? (
					<motion.span
						key="liked"
						variants={pop}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ type: "spring", stiffness: 520, damping: 22 }}
						className="grid place-items-center"
					>
						<HiMiniHeart size={18} className="text-pro drop-shadow-sm" />
					</motion.span>
				) : (
					<motion.span
						key="unliked"
						variants={pop}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ type: "spring", stiffness: 520, damping: 26 }}
						className="grid place-items-center"
					>
						<HiOutlineHeart size={18} className={ClassName} />
					</motion.span>
				)}
			</AnimatePresence>
		</motion.button>
	);
}
