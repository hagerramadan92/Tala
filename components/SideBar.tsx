"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	User,
	ShoppingBag,
	Heart,
	MapPin,
	HelpCircle,
} from "lucide-react";

interface SideBarProps {
	active: string;
}

export default function SideBar({ active }: SideBarProps) {
	const pathname = usePathname();

	const items = [
		{
			key: "account",
			label: "حسابي",
			href: "/myAccount",
			icon: User,
		},
		{
			key: "orders",
			label: "طلباتي",
			href: "/myAccount/orders",
			icon: ShoppingBag,
		},
		{
			key: "favorites",
			label: "منتجاتي المفضلة",
			href: "/myAccount/favorites",
			icon: Heart,
		},
		{
			key: "addresses",
			label: "إدارة العناوين",
			href: "/myAccount/addresses",
			icon: MapPin,
		},
		{
			key: "help",
			label: "مركز المساعدة",
			href: "/myAccount/help",
			icon: HelpCircle,
		},
	];

	return (
		<aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
			<ul className="flex flex-col gap-1">
				{items.map((item) => {
					const isActive =
						pathname === item.href ||
						(item.key === "account" && pathname === "/myAccount");

					const Icon = item.icon;

					return (
						<li key={item.key}>
							<Link
								href={item.href}
								className={`
                  group relative flex items-center gap-3 rounded-xl px-4 py-3
                  text-[0.95rem] font-semibold transition-all duration-300
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-pro
                  ${isActive
										? "bg-pro  text-white"
										: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
									}
                `}
							>
								{/* Active indicator */}
								{isActive && (
									<span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-pro" />
								)}

								{/* Icon */}
								<Icon
									size={18}
									className={`
                    transition-colors
                    ${isActive
											? "text-white "
											: "text-slate-400 group-hover:text-slate-600"
										}
                  `}
								/>

								{/* Label */}
								<span className="flex-1">{item.label}</span>

								{/* Hover arrow */}
								<span
									className={`
                    text-slate-400 transition-all duration-300
                    ${isActive
											? "opacity-100 translate-x-0"
											: "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
										}
                  `}
								>
									←
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</aside>
	);
}
