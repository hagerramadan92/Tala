"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function LoadingOverlay({ show, message }: { show: boolean; message?: string }) {
	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4 }}
					className="fixed inset-0 z-[999900000] flex items-center justify-center bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-md"
				>
					<motion.div
						initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
						animate={{ scale: 1, opacity: 1, rotate: 0 }}
						exit={{ scale: 0.7, opacity: 0, rotate: 10 }}
						transition={{ type: "spring", stiffness: 280, damping: 20 }}
						className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl"
					>
						<div className="w-16 h-16 border-4 border-t-transparent border-blue-500 border-b-blue-400 rounded-full animate-spin-slow"></div>
						<p className="text-center font-extrabold text-slate-900 text-lg drop-shadow-md">
							{message || "جاري التوجيه..."}
						</p>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
