import type { Metadata } from "next";
import "./globals.css";
import "@/styles/screen.css";
import { Toaster } from "react-hot-toast";
import Providers from "./Providers";
import { AppProvider } from "@/src/context/AppContext";
import { ToastProvider } from "@/src/context/ToastContext";
import { Cairo } from "next/font/google";
import LayoutShell from "./LayoutShell";
import '@/lib/fontawesome'

const cairo = Cairo({
	subsets: ["arabic"],
	weight: ["300", "400", "600", "700"],
	display: "swap"
});

export const metadata: Metadata = {
	title: {
		default: "Ecommerce | تسوق أذكى وأسهل",
		template: "%s | Ecommerce",
	},
	description: "منصة تجارة إلكترونية متكاملة توفر لك تجربة تسوق سهلة، آمنة وسريعة مع أفضل المنتجات والخدمات.",
	keywords: ["تجارة إلكترونية", "تسوق أونلاين", "متجر إلكتروني", "Ecommerce", "شراء منتجات", "الدفع عند الاستلام", "منتجات مخصصة",],

	authors: [{ name: "Ecommerce Team" }],
	creator: "Ecommerce",
	publisher: "Ecommerce",

	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},

	alternates: {
		canonical: "/",
		languages: {
			ar: "/",
		},
	},

	openGraph: {
		type: "website",
		locale: "ar_AR",
		url: "https://your-domain.com",
		siteName: "Ecommerce",
		title: "Ecommerce | تسوق أذكى وأسهل",
		description:
			"اكتشف تجربة تسوق عربية حديثة مع منتجات عالية الجودة وخدمة عملاء مميزة.",
		images: [
			{
				url: "/og-image.jpg", // ✨ حط صورة OG حقيقية
				width: 1200,
				height: 630,
				alt: "Ecommerce متجر إلكتروني",
			},
		],
	},

	twitter: {
		card: "summary_large_image",
		title: "Ecommerce | تسوق أذكى وأسهل",
		description:
			"منصة تجارة إلكترونية عربية توفر لك أفضل تجربة شراء.",
		images: ["/og-image.jpg"],
	},

	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},

	manifest: "/site.webmanifest",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {

	return (
		<html lang="ar" dir="rtl" className={cairo.className}>

			<body className="bg-white">
				<AppProvider>
					<ToastProvider>
						<Providers>
							{/* <Navbar /> */}
							<LayoutShell>{children}</LayoutShell>
							{/* <div className=" min-h-[80vh] pt-[90px] lg:pt-[140px]"></div> */}

							<Toaster position="top-center" />
							{/* <Footer /> */}
						</Providers>
					</ToastProvider>
				</AppProvider>
			</body>
		</html>
	);
}
