"use client";

import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { useAppContext } from "../src/context/AppContext";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

export default function FloatingWhatsAppButton() {
	const { socialMedia } = useAppContext() as any;
	const pathname = usePathname();

	const whatsappUrl = useMemo(() => {
		if (!Array.isArray(socialMedia)) return null;

		const whatsappItem = socialMedia.find((s: any) => s.key === "whatsapp" && s.value);
		if (!whatsappItem) return null;

		const value = String(whatsappItem.value).trim();
		if (value.startsWith("http")) return value;

		const digits = value.replace(/[^\d]/g, "");
		return digits ? `https://wa.me/${digits}` : null;
	}, [socialMedia]);


	// ✅ detect /product/[id]
	const isProductPage = useMemo(() => {
		return /^\/product\/[^\/]+$/.test(pathname || "") || /^\/products\/[^\/]+$/.test(pathname || "");
	}, [pathname]);

	if (!whatsappUrl) return null;
	return (
		<motion.a
			href={whatsappUrl}
			target="_blank"
			rel="noreferrer"
			aria-label="تواصل معنا عبر واتساب"
			initial={{ opacity: 0, scale: 0.6, y: 40 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.95 }}
			className={[
				"fixed right-5 z-[9999] w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl hover:shadow-2xl",
				// ✅ default bottom
				"bottom-5",
				// ✅ on PRODUCT page: push it up ONLY on mobile
				isProductPage ? "max-sm:bottom-[200px] !right-3" : "",
			].join(" ")}
		>
			<span className="absolute h-full w-full rounded-full bg-[#25D366] opacity-30 animate-ping" />
			<FaWhatsapp size={28} className="text-white relative z-10" />
		</motion.a>
	);
}
