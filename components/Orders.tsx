"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import NoOrders from "./NoOrders";
import Image from "next/image";
import Link from "next/link";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";
import { ClipboardList, Package, ShoppingCartIcon } from "lucide-react";

interface Order {
	id: number;
	order_number: string;
	status: string;
	formatted_total: string;
	items_count: number;
	created_at: string;
	can_cancel: boolean;
	items: any[];
}

/* ---------------- Skeleton bits ---------------- */

function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
				"sk-shimmer",
				className,
			].join(" ")}
		/>
	);
}

function OrdersSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div dir="rtl" className="space-y-5">
			{/* Header skeleton */}
			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<div className="space-y-2">
						<Sk className="h-6 w-28" />
						<Sk className="h-4 w-48" />
					</div>

					<div className="w-full md:w-[420px]">
						<Sk className="h-11 w-full rounded-xl" />
					</div>
				</div>
			</div>

			{/* Cards skeleton */}
			<div className="grid gap-4">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
					>
						<div className="bg-slate-50 p-4 flex items-center justify-between">
							<div className="space-y-2">
								<Sk className="h-4 w-44" />
								<Sk className="h-4 w-36" />
							</div>
							<div className="space-y-2 text-left">
								<Sk className="h-4 w-28" />
								<Sk className="h-4 w-24" />
							</div>
						</div>

						<div className="p-4">
							<div className="flex gap-4">
								<Sk className="h-[90px] w-[90px] rounded-2xl" />
								<div className="flex-1 space-y-2">
									<Sk className="h-4 w-2/3" />
									<Sk className="h-4 w-1/2" />
									<Sk className="h-4 w-1/3" />
								</div>
							</div>

							<div className="mt-4">
								<Sk className="h-7 w-28 rounded-full" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ---------------- Helpers ---------------- */

function statusUI(status: string) {
	if (status === "pending")
		return { label: "جاري التنفيذ", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" };
	if (status === "completed")
		return { label: "تم التنفيذ", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };
	if (status === "cancelled")
		return { label: "ملغى", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" };
	return { label: status, cls: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
}

/* ---------------- Component ---------------- */

export default function Orders() {
	const [search, setSearch] = useState<string>("");
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	const [page, setPage] = useState<number>(1);
	const [lastPage, setLastPage] = useState<number>(1);
	const [apiToken, setApiToken] = useState<string | null>(null);

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("auth_token");
			setApiToken(token);
		}
	}, []);

	useEffect(() => {
		if (!apiToken) return;

		const fetchOrders = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${baseUrl}/order?page=${page}`, {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiToken}`,
					},
					cache: "no-store",
				});

				const data = await res.json();

				if (data.status && data.data?.data) {
					setOrders(data.data.data);
					setLastPage(data.data.meta.last_page);
				} else {
					setOrders([]);
					setLastPage(1);
				}
			} catch (error) {
				console.error("Error fetching orders:", error);
				setOrders([]);
				setLastPage(1);
			} finally {
				setLoading(false);
			}
		};

		fetchOrders();
	}, [apiToken, baseUrl, page]);

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		setPage(1);
	};

	// ✅ useMemo to avoid filtering on every render
	const filteredOrders = useMemo(() => {
		const q = search.trim();
		if (!q) return orders;
		return orders.filter((order) => order.order_number.includes(q));
	}, [orders, search]);

	if (loading) return <OrdersSkeleton count={4} />;

	return (
		<div dir="rtl" className="space-y-5">
			{/* Empty state */}
			{orders.length === 0 ? (
				<div className=" mt-12 flex items-center flex-col">
					<Image src="/images/no-order.png" width={230} height={220} alt="notfound" />
					<NoOrders title="ليس لديك أي طلبات حتى الآن." />
				</div>
			) : (
				<>
					{/* Header */}
					<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
							<div>
								<h2 className="text-xl font-extrabold text-slate-900">طلباتي</h2>
								<p className="mt-1 text-sm text-slate-500">
									يمكنك البحث برقم الطلب ومراجعة تفاصيل كل طلب.
								</p>
							</div>

							<div className="flex  flex-row gap-3 w-full md:w-auto">
								<div className="relative w-full md:w-[420px]">
									<FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder="ابحث برقم الطلب"
										value={search}
										onChange={handleSearchChange}
										className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-3 text-sm font-semibold text-slate-900
                               placeholder:text-slate-400 outline-none transition
                               focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
									/>
								</div>

								<div className=" text-nowrap max-md:text-xs inline-flex items-center justify-center rounded-xl bg-slate-50 max-md:p-2 px-4 py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
									{filteredOrders.length} طلب
								</div>
							</div>
						</div>
					</div>

					{/* List */}
					{filteredOrders.length === 0 ? (
						<NoOrders title="ليس لديك أي طلبات" />
					) : (
						<div className="grid gap-4">
							{filteredOrders.map((order) => {
								const item = order.items?.[0];
								const img = item?.product?.image || "/images/noimg.png";
								const productName = item?.product?.name || "اسم المنتج";
								const productPrice = item?.product?.final_price || item?.price_per_unit || 0;
								const status = statusUI(order.status);

								return (
									<div
										key={order.id}
										className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
									>
										{/* top bar */}
										<div className="bg-gradient-to-b from-slate-50 to-white p-4 flex items-center justify-between gap-3">
											<div className="space-y-1">
												<p className="text-slate-700 font-semibold">
													رقم الطلب: <span className="font-extrabold">{order.order_number}</span>
												</p>
												<p className="text-slate-700 font-semibold">
													الإجمالي: <span className="font-extrabold">{order.formatted_total}</span>
												</p>
											</div>

											<div className="flex flex-col items-end gap-2">
												<Link
													href={`/myAccount/${order.id}`}
													className=" text-nowrap inline-flex items-center gap-1 rounded-xl bg-pro/10 max-md:p-2 px-3 py-2 text-sm font-extrabold text-pro ring-1 ring-pro/15 hover:bg-pro/15 transition"
												>
													عرض التفاصيل
													<MdOutlineKeyboardArrowLeft className="text-pro" />
												</Link>

												<span className="text-xs font-bold text-slate-500">
													{order.created_at}
												</span>
											</div>
										</div>

										{/* body */}
										<div className="p-4">
											<div className="relative flex gap-4">
												<Image
													src={img}
													alt={productName}
													width={92}
													height={92}
													className="rounded-2xl object-cover ring-1 ring-black/5 bg-slate-50"
												/>

												<span className="absolute -top-2 start-[74px] rounded-full min-w-[28px] h-7 px-2 text-white bg-pro text-center text-xs font-extrabold grid place-items-center ring-2 ring-white">
													{order.items_count}
												</span>

												<div className="flex flex-col gap-1 min-w-0">
													<p className="text-slate-900 font-extrabold line-clamp-1">
														{productName}
													</p>

													<p className="text-slate-600 text-sm font-semibold">
														سعر المنتج: <span className="font-extrabold">{productPrice}</span> ريال
													</p>

													<p className="text-slate-600 text-sm font-semibold">
														رقم المنتج:{" "}
														<span className="font-extrabold">#{item?.product?.id ?? "—"}</span>
													</p>

													<div className="mt-2">
														<span className={`inline-flex px-3 py-1 rounded-full text-sm font-extrabold ${status.cls}`}>
															{status.label}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{lastPage > 1 && (
						<div className="flex justify-center mt-6">
							<Stack spacing={2}>
								<Pagination
									count={lastPage}
									page={page}
									onChange={(event, value) => setPage(value)}
									color="primary"
									sx={{
										"& .MuiPaginationItem-icon": {
											transform: "scaleX(-1)",
										},
									}}
								/>
							</Stack>
						</div>
					)}
				</>
			)}
		</div>
	);
}
