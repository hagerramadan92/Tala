"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsAppButton from "../components/WhatsappButton";
import HeaderAdsSlider from "../components/HeaderAdsSlider";

export default function LayoutShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	const hideLayout = ["/login", "/signup", "/login/forgetPassword", "/login/resetpassword"].includes(
		pathname
	);

	return (
		<>
 			{!hideLayout && <Navbar />}

			<div className={`${!hideLayout ? "pt-[90px] lg:pt-[110px]" : ""}   min-h-[80vh]`}>
				{children}
			</div>

			{!hideLayout && <Footer />}
			<FloatingWhatsAppButton />
		</>
	);
}
