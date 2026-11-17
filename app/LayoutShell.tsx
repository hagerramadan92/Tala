"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsAppButton from "../components/WhatsappButton";
import SpecialOrderButton from "../components/SpecialOrderButton";
import HeaderAdsSlider from "../components/HeaderAdsSlider";

export default function LayoutShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const [loginOpen, setLoginOpen] = useState(false);

	// أي مكان في الموقع يفتح بوب اب الدخول عبر هذا الحدث
	useEffect(() => {
		const open = () => setLoginOpen(true);
		window.addEventListener("open-login-modal", open as EventListener);
		return () => window.removeEventListener("open-login-modal", open as EventListener);
	}, []);

	const hideLayout = ["/login", "/signup", "/login/forgetPassword", "/login/resetpassword"].includes(
		pathname
	);
	const isHome = pathname === "/";

	return (
		<div>
			{!hideLayout && <Navbar />}

			<div className={`${!hideLayout ? "pt-[90px] lg:pt-[110px]" : ""}   min-h-[80vh]`}>
				{children}
			</div>

			{!hideLayout && <Footer />}

			<LoginModal
				open={loginOpen}
				onClose={() => setLoginOpen(false)}
				onSuccess={() => {
					setLoginOpen(false);
					router.refresh();
				}}
			/>
			<FloatingWhatsAppButton />
			<SpecialOrderButton />
		</div>
	);
}
