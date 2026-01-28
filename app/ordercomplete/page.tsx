"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { TbCopy } from "react-icons/tb";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { FiCheckCircle } from "react-icons/fi";

import OrderProgress from "@/components/OrderProgress";
import { useCart } from "@/src/context/CartContext";

type AnyObj = Record<string, any>;

type CheckoutSummaryV1 = {
	version?: string;
	created_at?: string;
	items_count?: number;
	items_length?: number;
	subtotal?: number;
	total?: number;
	coupon_discount?: number;
	coupon_name?: string;
	coupon_new_total?: number | null;
	shipping_fee?: number;
	tax_rate?: number;
	total_after_coupon?: number;
	total_with_shipping?: number;
	tax_amount?: number;
	total_without_tax?: number;
	coupon_value?: number;
};

function SkeletonCard() {
	return (
		<div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-pulse">
			<div className="h-6 bg-slate-100 rounded-xl w-1/3 mb-4" />
			<div className="h-20 bg-slate-100 rounded-2xl w-full" />
			<div className="h-10 bg-slate-100 rounded-2xl w-full mt-4" />
		</div>
	);
}

function n(v: any) {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
}

function money(v: number) {
	return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function readSessionJSON<T>(key: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function readLocalJSON<T>(key: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function parseOptions(raw: any) {
	if (Array.isArray(raw)) return raw;
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

function computeOrderItemPricing(orderItem: AnyObj) {
	const product = orderItem?.product || {};
	const qty = Math.max(1, n(orderItem?.quantity || 1));

	const options = parseOptions(orderItem?.options);

	// Base: discount final_price else price
	const base = product?.has_discount ? n(product?.final_price) : n(product?.price);

	// size tiers (if any)
	let sizeTierUnit: number | null = null;
	const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
	const selectedSize = options.find((o: AnyObj) => String(o.option_name || "").includes("المقاس"))?.option_value;

	if (selectedSize && sizes.length) {
		const sizeObj = sizes.find((s: AnyObj) => String(s.name).trim() === String(selectedSize).trim());
		const tiers = Array.isArray(sizeObj?.tiers) ? sizeObj.tiers : [];
		if (tiers.length) {
			const sorted = tiers
				.map((t: AnyObj) => ({ q: n(t.quantity), unit: n(t.price_per_unit) }))
				.filter((t: AnyObj) => t.q > 0 && t.unit > 0)
				.sort((a: AnyObj, b: AnyObj) => a.q - b.q);

			const best = sorted.filter((t: AnyObj) => t.q <= qty).at(-1);
			if (best?.unit) sizeTierUnit = best.unit;
		}
	}

	// Extras
	let extra = 0;

	const productOptions = Array.isArray(product?.options) ? product.options : [];
	const colors = Array.isArray(product?.colors) ? product.colors : [];
	const materials = Array.isArray(product?.materials) ? product.materials : [];
	const printingMethods = Array.isArray(product?.printing_methods) ? product.printing_methods : [];
	const printLocations = Array.isArray(product?.print_locations) ? product.print_locations : [];

	for (const opt of options) {
		const name = String(opt?.option_name || "").trim();
		const value = String(opt?.option_value || "").trim();
		if (!name || !value) continue;

		// product.options
		const match = productOptions.find(
			(x: AnyObj) => String(x.option_name).trim() === name && String(x.option_value).trim() === value
		);
		if (match) extra += n(match.additional_price);

		// color additional
		if (name === "اللون") {
			const c = colors.find((x: AnyObj) => String(x.name).trim() === value);
			if (c) extra += n(c.additional_price);
		}

		// material additional
		if (name === "الخامة") {
			const m = materials.find((x: AnyObj) => String(x.name).trim() === value);
			if (m) extra += n(m.additional_price);
		}

		// printing method price
		if (name === "طريقة الطباعة") {
			const pm = printingMethods.find((x: AnyObj) => String(x.name).trim() === value);
			if (pm) extra += n(pm.pivot_price ?? pm.base_price);
		}

		// print location price
		if (name === "مكان الطباعة") {
			const loc = printLocations.find((x: AnyObj) => String(x.name).trim() === value);
			if (loc) extra += n(loc.pivot_price ?? loc.additional_price);
		}
	}

	const unit = (sizeTierUnit ?? base) + extra;
	const line = unit * qty;

	return { unit, line, options, qty, base, extra };
}

function mapPaymentLabel(method: string) {
	const map: Record<string, string> = {
		cash_on_delivery: "الدفع عند الاستلام",
		credit_card: "الدفع بالبطاقة",
		applePay: "Apple Pay",
		stcPay: "STC Pay",
		tamara: "Tamara",
		tabby: "Tabby",
	};
	return map[method] || method || "طريقة دفع";
}

function SummaryBlock({ summary }: { summary: CheckoutSummaryV1 | null }) {
	if (!summary) return null;

	const shippingFree = n(summary.shipping_fee) <= 0;
	const hasCoupon = n(summary.coupon_discount) > 0 || summary.coupon_new_total !== null;

	return (
		<div className="my-2 gap-2 flex flex-col">
			<div className="flex text-sm items-center justify-between text-black">
				<p className="font-semibold">المجموع ({n(summary.items_length)} عناصر)</p>
				<p>
					{money(n(summary.subtotal))}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between">
				<p className="text-sm">إجمالي رسوم الشحن</p>
				{shippingFree ? (
					<p className="font-semibold text-green-600">مجانا</p>
				) : (
					<p className="text-md">
						{money(n(summary.shipping_fee))} <span className="text-sm ms-1">ريال</span>
					</p>
				)}
			</div>

			{hasCoupon && (
				<div className="flex items-center justify-between text-sm">
					<p className="text-emerald-800 font-semibold">خصم الكوبون</p>
					<p className="font-extrabold text-emerald-700">
						- {money(n(summary.coupon_discount))}
						<span className="text-sm ms-1">ريال</span>
					</p>
				</div>
			)}

			<div className="flex items-center justify-between text-sm">
				<p>ضريبة القيمة المضافة ({Math.round(n(summary.tax_rate) * 100) || 15}%)</p>
				<p className="font-semibold">
					{money(n(summary.tax_amount))}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between text-sm">
				<p>الإجمالي بدون الضريبة</p>
				<p className="font-semibold">
					{money(n(summary.total_without_tax))}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between pb-3 pt-2">
				<div className="flex gap-1 items-center">
					<p className=" text-nowrap text-md text-pro font-semibold">الإجمالي :</p>
				</div>
				<p className="text-[15px] text-pro font-bold">
					{money(n(summary.total_with_shipping))}
					<span> ريال</span>
				</p>
			</div>
		</div>
	);
}

export default function OrderCompletePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId"); // ✅ from url

	const steps = ["تم الطلب", "جاري التنفيذ", "جاري التوصيل", "تم التوصيل"];
	const statusSteps: Record<string, number> = {
		pending: 0,
		processing: 1,
		delivering: 2,
		completed: 3,
		cancelled: 0,
	};

	const [currentStep, setCurrentStep] = useState(0);
	const [order, setOrder] = useState<AnyObj | null>(null);
	const [loading, setLoading] = useState(true);

	// ✅ summary from sessionStorage
	const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryV1 | null>(null);

	const { clearCart } = useCart();

	// ✅ clear cart once
	useEffect(() => {
		clearCart().catch(() => {});
	}, [clearCart]);

	// ✅ read summary from sessionStorage (fallback localStorage)
	useEffect(() => {
		const s = readSessionJSON<CheckoutSummaryV1>("checkout_summary_v1");
		const l = readLocalJSON<CheckoutSummaryV1>("checkout_summary_v1");
		setCheckoutSummary(s || l || null);
	}, []);

	// ✅ fetch from /order/{orderId}
	useEffect(() => {
		const fetchOrder = async () => {
			if (!orderId) {
				setLoading(false);
				setOrder(null);
				return;
			}

			setLoading(true);
			try {
				const token = localStorage.getItem("auth_token") || "";
				const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/${orderId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
					cache: "no-store",
				});

				const data = await res.json().catch(() => null);

				if (res.ok && data?.status && data?.data) {
					setOrder(data.data);
					setCurrentStep(statusSteps[data.data.status] ?? 0);
				} else {
					setOrder(null);
				}
			} catch (err) {
				console.error("Fetch order error:", err);
				setOrder(null);
			} finally {
				setLoading(false);
			}
		};

		fetchOrder();
	}, [orderId]);

	// ✅ compute totals from items.products + options (kept for items line prices display)
	const computed = useMemo(() => {
		const items = Array.isArray(order?.items) ? order!.items : [];

		const computedItems = items.map((it: AnyObj) => {
			const pr = computeOrderItemPricing(it);
			return { ...it, _unit: pr.unit, _line: pr.line, _opts: pr.options, _qty: pr.qty };
		});

		const subtotal = computedItems.reduce((acc: number, it: AnyObj) => acc + n(it._line), 0);

		return { items: computedItems, subtotal, total: subtotal };
	}, [order]);

	const copyOrderNumber = async () => {
		const value = String(order?.order_number || "");
		if (!value) return;

		try {
			await navigator.clipboard.writeText(value);
			Swal.fire({
				icon: "success",
				title: "تم النسخ",
				text: "تم نسخ رقم الطلب بنجاح",
				timer: 1400,
				showConfirmButton: false,
			});
		} catch {
			Swal.fire("تنبيه", "تعذر النسخ تلقائيًا، انسخ يدويًا.", "warning");
		}
	};

	const isCancelled = order?.status === "cancelled";

	return (
		<div className="container py-6" dir="rtl">
			{/* ✅ top row includes orderId */}
			<div className="flex items-center justify-between gap-2 text-sm mb-4">
				<div className="flex items-center gap-2">
					<button
						onClick={() => router.back()}
						className="text-pro-max font-extrabold flex items-center gap-1 hover:opacity-80"
					>
						<MdKeyboardArrowLeft size={18} />
						رجوع
					</button>

					<span className="text-slate-300">/</span>
					<span className="text-slate-600 font-semibold">إتمام الطلب</span>
				</div>

				{orderId && (
					<span className="text-xs font-extrabold rounded-full px-3 py-1 border border-slate-200 bg-slate-50 text-slate-700">
						Order ID: {orderId}
					</span>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* LEFT */}
				<div className="col-span-1 lg:col-span-2 space-y-4">
					{loading ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : !order ? (
						<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
							<p className="font-extrabold text-slate-900 text-lg">تعذر تحميل بيانات الطلب</p>
							<p className="text-slate-600 mt-2">تأكد من وجود orderId في الرابط وأنك مسجل دخول.</p>

							<div className="mt-4 flex gap-2">
								<button
									onClick={() => router.refresh()}
									className="rounded-2xl px-4 py-2 font-extrabold border border-slate-200 bg-slate-50 hover:bg-slate-100"
								>
									تحديث
								</button>

								<Link
									href="/myAccount/orders"
									className="rounded-2xl px-4 py-2 font-extrabold bg-pro text-white hover:opacity-90"
								>
									طلباتي
								</Link>
							</div>
						</div>
					) : (
						<>
							{/* Header */}
							<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
								<div className="flex items-start justify-between gap-4">
									<div className="flex items-center gap-3">
										<div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
											<FiCheckCircle className="text-emerald-600" size={26} />
										</div>

										<div>
											<div className="flex items-center gap-1 text-2xl font-extrabold text-slate-900">
												<span>شكرًا</span>
												<span className="text-emerald-600">{order.customer_name}</span>
												<span>!</span>
											</div>
											<p className="text-slate-500 font-semibold mt-1">تم استلام طلبك بنجاح 🎉</p>
											{order?.created_at && (
												<p className="text-xs text-slate-500 font-semibold mt-1">
													تاريخ الإنشاء:{" "}
													<span className="font-extrabold text-slate-700">{order.created_at}</span>
												</p>
											)}
										</div>
									</div>

									<div className="flex flex-col items-end gap-2">
										<div className="flex items-center gap-2">
											<span className="text-xs font-extrabold rounded-full px-3 py-1 border border-slate-200 bg-slate-50 text-slate-700">
												رقم الطلب
											</span>

											<span className="font-extrabold text-slate-900">{order.order_number}</span>

											<button
												onClick={copyOrderNumber}
												className="rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
												aria-label="copy order number"
												title="نسخ رقم الطلب"
											>
												<TbCopy size={18} className="text-slate-700" />
											</button>
										</div>

										<span
											className={`text-xs font-extrabold rounded-full px-3 py-1 border ${
												isCancelled
													? "bg-rose-50 border-rose-200 text-rose-700"
													: "bg-emerald-50 border-emerald-200 text-emerald-700"
											}`}
										>
											{isCancelled ? "تم إلغاء الطلب" : order.status || "قيد المتابعة"}
										</span>
									</div>
								</div>

								{/* Progress */}
								<div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
									{isCancelled ? (
										<p className="text-rose-700 font-extrabold">تم إلغاء هذا الطلب</p>
									) : (
										<OrderProgress steps={steps} currentStep={currentStep} />
									)}
								</div>
							</div>

							{/* Shipping Address */}
							<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
								<h5 className="font-extrabold text-xl text-slate-900 mb-3">عنوان الشحن</h5>

								{order?.full_address ? (
									<div className="text-slate-700 font-semibold space-y-1">
										<p className="font-extrabold">{order.full_address.full_name}</p>
										<p>
											{order.full_address.city} - {order.full_address.area}
										</p>
										<p>{order.full_address.details}</p>
										{order.full_address.phone && (
											<p className="text-slate-600">{order.full_address.phone}</p>
										)}
									</div>
								) : (
									<p className="text-slate-600 font-semibold">لا يوجد عنوان شحن محفوظ.</p>
								)}
							</div>

							{/* Payment */}
							<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
								<h5 className="font-extrabold text-xl text-slate-900 mb-3">طريقة الدفع</h5>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
											<Image src="/images/cod.png" alt="payment method" width={44} height={28} />
										</div>
										<p className="text-lg text-slate-900 font-extrabold">
											{mapPaymentLabel(order.payment_method_label)}
										</p>
									</div>

									{order?.notes && (
										<span className="text-xs font-extrabold rounded-full px-3 py-1 border border-slate-200 bg-slate-50 text-slate-700">
											{order.notes}
										</span>
									)}
								</div>
							</div>

							{/* Support */}
							<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
								<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
									<div className="text-slate-700 font-semibold">
										<span>إذا كنت بحاجة إلى أي دعم</span>{" "}
										<span className="text-slate-300 mx-1">|</span>{" "}
										<Link
											href="/myAccount/help"
											className="underline font-extrabold text-slate-900"
										>
											مركز المساعدة
										</Link>
									</div>

									<Link
										href="/"
										className="rounded-2xl bg-pro text-white px-5 py-2 font-extrabold hover:opacity-90"
									>
										إضافة طلب جديد
									</Link>
								</div>
							</div>
						</>
					)}
				</div>

				{/* RIGHT */}
				<div className="col-span-1 space-y-4 lg:sticky lg:top-[140px] h-fit">
					{/* Items */}
					<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
						<h2 className="font-extrabold text-xl text-slate-900 mb-4">تفاصيل الطلب</h2>

						{loading ? (
							<div className="space-y-3">
								<div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
								<div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
							</div>
						) : (
							<div className="space-y-3">
								{computed.items.map((it: AnyObj, idx: number) => {
									const p = it.product || {};
									const img = p.image || "/images/not.jpg";
									const name = it.product_name || p.name || "منتج";
									const qty = it._qty || 1;
									const opts = Array.isArray(it._opts) ? it._opts : [];

									return (
										<div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
											<div className="flex items-start gap-3">
												<div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0">
													<Image src={img} alt={name} fill sizes="56px" className="object-cover" />
												</div>

												<div className="flex-1">
													<p className="font-extrabold text-slate-900">{name}</p>
													<p className="text-sm text-slate-600 font-semibold mt-1">الكمية: {qty}</p>

													<p className="mt-2 font-extrabold text-slate-900">
														{money(n(it._line))} <span className="text-xs text-slate-600">ر.س</span>
													</p>

													{opts.length > 0 && (
														<div className="mt-2 flex flex-wrap gap-2">
															{opts.slice(0, 6).map((o: AnyObj, i: number) => (
																<span
																	key={`${o.option_name}-${o.option_value}-${i}`}
																	className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700"
																>
																	{o.option_name}: {o.option_value}
																</span>
															))}
															{opts.length > 6 && (
																<span className="text-xs font-extrabold text-slate-500">+{opts.length - 6} المزيد</span>
															)}
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})}

								{!computed.items.length && (
									<div className="rounded-3xl border border-slate-200 bg-white p-4 text-center">
										<p className="text-slate-600 font-extrabold">لا توجد عناصر</p>
									</div>
								)}
							</div>
						)}
					</div>

					{/* ✅ Summary FROM sessionStorage (checkout_summary_v1) */}
					<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
						<h2 className="font-extrabold text-xl text-slate-900 mb-4">ملخص الطلب</h2>

						{loading ? (
							<SkeletonCard />
						) : checkoutSummary ? (
							<SummaryBlock summary={checkoutSummary} />
						) : (
							<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
								<p className="font-extrabold text-amber-800 text-sm">
									ملخص الطلب غير موجود (checkout_summary_v1). ارجع للسلة ثم ادخل صفحة الدفع/الإتمام مرة أخرى.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
