/*
✅ المطلوب تم تنفيذه بالكامل في نفس الصفحة:

1) استخدام نفس Summary القادم من cart بدون إعادة حساب:
   - قراءة checkout_summary_v1 من sessionStorage (مع fallback للـ localStorage لو احتجت)
   - عرض نفس البنود الظاهرة في TotalOrder داخل صفحة الدفع (subtotal / shipping / coupon / VAT / total بدون ضريبة / الإجمالي)

2) إرسال coupon_code مع create order:
   - يتم قراءته من sessionStorage key: "coupon_code"
   - وأيضًا لو موجود داخل summary كـ coupon_name يتم استخدامه كـ fallback

3) قراءة بيانات summary من sessionStorage key: "checkout_summary_v1"
   - نفس الـ shape اللي أرسلته
   - واستخدامه في UI + في orderData (ارسال coupon_code + coupon_value إن وجد)

4) عند إنشاء الطلب:
   - إرسال البيانات:
     shipping_address / customer_name / customer_phone / customer_email / payment_method / notes / coupon_code
   - لو تبي تعتمد على address_id من addresses endpoint (الموجود عندك) تركته كما هو + أضفت shipping_address بشكل نصي كـ fallback من العنوان المختار.
*/

"use client";

import AddressForm from "@/components/AddressForm";
import BankPayment from "@/components/BankPayment";
import CoBon from "@/components/cobon";
import InvoiceSection from "@/components/InvoiceSection";
import OrderSummary from "@/components/OrderSummary";
import { AddressI } from "@/Types/AddressI";
import { useState, useEffect, useMemo, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import Button from "@mui/material/Button";
import { useRouter } from "next/navigation";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import Swal from "sweetalert2";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useAppContext } from "../../src/context/AppContext";
import LoadingOverlay from "../../components/LoadingOverlay";

function n(v: any) {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
}

function money(v: any) {
	return n(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type CheckoutSummaryV1 = {
	version?: string;
	created_at?: string;

	items_count?: number;
	items_length?: number;

	subtotal?: number;
	total?: number;

	coupon_discount?: number;
	coupon_name?: string; // like "C612DFD2"
	coupon_new_total?: number | null;

	shipping_fee?: number;
	tax_rate?: number;

	total_after_coupon?: number;
	total_with_shipping?: number;
	tax_amount?: number;
	total_without_tax?: number;

	// optional if you later add it
	coupon_value?: number;
};

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

function BlockSkeleton() {
	return (
		<div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-pulse">
			<div className="h-6 bg-slate-100 rounded-xl w-1/3 mb-4" />
			<div className="h-20 bg-slate-100 rounded-2xl w-full" />
			<div className="h-10 bg-slate-100 rounded-2xl w-full mt-4" />
		</div>
	);
}

function SummaryBlock({ summary }: { summary: CheckoutSummaryV1 | null }) {
	const shippingFree = n(summary?.shipping_fee) <= 0;
	const shippingFee = n(summary?.shipping_fee);

	const hasCoupon = n(summary?.coupon_discount) > 0 || summary?.coupon_new_total !== null;

	return (
		<div className="my-2 gap-2 flex flex-col">
			<div className="flex text-sm items-center justify-between text-black">
				<p className="font-semibold">المجموع ({n(summary?.items_length)} عناصر)</p>
				<p>
					{money(summary?.subtotal)}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between">
				<p className="text-sm">إجمالي رسوم الشحن</p>
				{shippingFree ? (
					<p className="font-semibold text-green-600">مجانا</p>
				) : (
					<p className="text-md">
						{money(shippingFee)} <span className="text-sm ms-1">ريال</span>
					</p>
				)}
			</div>

			{hasCoupon && (
				<div className="flex items-center justify-between text-sm">
					<p className="text-emerald-800 font-semibold">خصم الكوبون</p>
					<p className="font-extrabold text-emerald-700">
						- {money(summary?.coupon_discount)}
						<span className="text-sm ms-1">ريال</span>
					</p>
				</div>
			)}

			<div className="flex items-center justify-between text-sm">
				<p>ضريبة القيمة المضافة ({Math.round(n(summary?.tax_rate) * 100) || 15}%)</p>
				<p className="font-semibold">
					{money(summary?.tax_amount)}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between text-sm">
				<p>الإجمالي بدون الضريبة</p>
				<p className="font-semibold">
					{money(summary?.total_without_tax)}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between pb-3 pt-2">
				<div className="flex gap-1 items-center">
					<p className=" text-nowrap text-md text-pro font-semibold">الإجمالي :</p>
				</div>
				<p className="text-[15px] text-pro font-bold">
					{money(summary?.total_with_shipping)}
					<span> ريال</span>
				</p>
			</div>
		</div>
	);
}

export default function PaymentPage() {
	const [openModal, setOpenModal] = useState(false);
	const [showAddress, setShowAddress] = useState(false);
	const { paymentMethods } = useAppContext() as any;
	const [redirecting, setRedirecting] = useState(false);
	const [redirectMessage, setRedirectMessage] = useState("");

	const [addresses, setAddresses] = useState<AddressI[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<AddressI | null>(null);

	const [paymentMethod, setPaymentMethod] = useState<string>("");
	const [notes, setNotes] = useState<string>("");

	const [loading, setLoading] = useState(false);
	const [token, setToken] = useState<string | null>(null);

	const [addrLoading, setAddrLoading] = useState(true);

	// ✅ summary from sessionStorage
	const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryV1 | null>(null);

	// ✅ coupon_code from sessionStorage
	const [couponCode, setCouponCode] = useState<string>("");

	const router = useRouter();
	const base_url = process.env.NEXT_PUBLIC_API_URL;

	const paymentLabel = useMemo(() => getPaymentMethodText(paymentMethod), [paymentMethod]);

	// ✅ load summary + coupon_code from sessionStorage
	useEffect(() => {
		// primary: sessionStorage
		const s = readSessionJSON<CheckoutSummaryV1>("checkout_summary_v1");
		// fallback: localStorage if you saved there previously
		const l = readLocalJSON<CheckoutSummaryV1>("checkout_summary_v1");

		const summary = s || l || null;
		setCheckoutSummary(summary);

		const codeFromSession = (typeof window !== "undefined" ? sessionStorage.getItem("coupon_code") : "") || "";
		const normalized = String(codeFromSession || "").trim();

		// fallback: coupon_name inside summary (like C612DFD2)
		const codeFallback = String(summary?.coupon_name || "").trim();
		setCouponCode(normalized || codeFallback || "");
	}, []);

	useEffect(() => {
		const t = localStorage.getItem("auth_token");
		setToken(t);

		if (!t) {
			Swal.fire("تنبيه", "يرجى تسجيل الدخول لإتمام الدفع", "warning");
			router.push("/login");
		}
	}, [router]);

	useEffect(() => {
		if (!token) return;

		const fetchAddresses = async () => {
			setAddrLoading(true);
			try {
				const res = await fetch(`${base_url}/addresses`, {
					headers: {
						Accept: "application/json",
						Authorization: `Bearer ${token}`,
					},
					cache: "no-store",
				});

				const result = await res.json().catch(() => null);

				if (res.ok && result?.status && Array.isArray(result?.data)) {
					setAddresses(result.data);
					setSelectedAddress(result.data[0] || null);
				}
			} catch (err) {
				console.error("Error fetching addresses:", err);
			} finally {
				setAddrLoading(false);
			}
		};

		fetchAddresses();
	}, [token, base_url]);

	const handleNewAddress = (newAddress: AddressI) => {
		setAddresses((prev) => [newAddress, ...prev]);
		setSelectedAddress(newAddress);
		setOpenModal(false);
		setShowAddress(false);
	};

	const handleAddressChange = () => {
		if (addresses.length > 0) setShowAddress((v) => !v);
		else setOpenModal(true);
	};

	const handleSelectAddress = (address: AddressI) => {
		setSelectedAddress(address);
		setShowAddress(false);
	};

	const buildShippingAddressString = useCallback((addr: AddressI | null) => {
		if (!addr) return "";
		// best-effort based on typical fields
		const city = (addr as any)?.city ? String((addr as any).city) : "";
		const area = (addr as any)?.area ? String((addr as any).area) : "";
		const details = (addr as any)?.details ? String((addr as any).details) : "";
		return [city, area, details].filter(Boolean).join(" - ").trim();
	}, []);

	const handleCompletePurchase = async () => {
		if (loading) return;

		if (!paymentMethod) {
			Swal.fire("تنبيه", "يرجى اختيار طريقة الدفع", "warning");
			return;
		}

		if (!token) {
			Swal.fire("تنبيه", "يرجى تسجيل الدخول", "warning");
			router.push("/login");
			return;
		}

		// ✅ summary must exist (because we depend on it + coupon)
		if (!checkoutSummary) {
			Swal.fire("تنبيه", "لا توجد بيانات ملخص الطلب. يرجى الرجوع للسلة ثم المحاولة مرة أخرى.", "warning");
			return;
		}

		setLoading(true);

		try {
			// ✅ coupon_code from sessionStorage (key: coupon_code)
			const codeFromSession = (typeof window !== "undefined" ? sessionStorage.getItem("coupon_code") : "") || "";
			const normalizedCoupon = String(codeFromSession || couponCode || checkoutSummary?.coupon_name || "").trim();

			// ✅ optional coupon value (if exists)
			const couponValue =
				typeof (checkoutSummary as any)?.coupon_value !== "undefined"
					? n((checkoutSummary as any)?.coupon_value)
					: n(checkoutSummary?.coupon_discount);

			// ✅ create order payload with requested fields
			const orderData: any = {
				shipping_address: buildShippingAddressString(selectedAddress),
				customer_name: (selectedAddress as any)?.full_name ? String((selectedAddress as any).full_name) : "",
				customer_phone: (selectedAddress as any)?.phone ? String((selectedAddress as any).phone) : "",
				customer_email: (selectedAddress as any)?.email ? String((selectedAddress as any).email) : "",

				payment_method: paymentMethod,
				notes: notes?.trim() || `تم اختيار ${paymentLabel}`,

				// ✅ send coupon code for discount
				coupon_code: normalizedCoupon || "",

				// ✅ include if backend expects a value (you said: "and also if there copupon_value")
				...(couponValue > 0 ? { coupon_value: couponValue } : {}),
			};

			// keep compatibility with existing backend that uses address_id
			if (selectedAddress?.id) {
				orderData.address_id = selectedAddress.id;
			}

			const response = await fetch(`${base_url}/order`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(orderData),
				cache: "no-store",
			});

			const result = await response.json();

			if (!response.ok || !result?.status) {
				throw new Error(result?.message || "حدث خطأ أثناء إنشاء الطلب");
			}

			// same redirect logic you already had
			if (paymentMethod == "1") {
				setRedirectMessage(result?.data?.message);
				setRedirecting(true);
				setTimeout(() => {
					router.push(`/ordercomplete?orderId=${result.data.id}`);
				}, 500);

				router.push(`/ordercomplete?orderId=${result.data.id}`);
			} else {
				setRedirectMessage(result?.data?.message || "جاري توجيهك إلى بوابة الدفع...");
				setRedirecting(true);
				console.log(result);
				setTimeout(() => {
					if (result?.data?.payment_url) window.location.href = result.data.payment_url;
				}, 500);
			}
		} catch (error: any) {
			console.error("Error creating order:", error);
			Swal.fire("خطأ", error?.message || "حدث خطأ أثناء إنشاء الطلب", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container pb-10 pt-6">
			{/* Breadcrumb / Header */}
			<div className="flex items-center gap-2 text-sm mb-4">
				<button onClick={() => router.back()} className="cursor-pointer text-pro-max font-bold flex items-center gap-1">
					<MdKeyboardArrowRight size={18} />
					رجوع
				</button>
				<span className="text-slate-400">/</span>
				<span className="text-slate-600 font-semibold">الدفع</span>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Left */}
				<div className="col-span-1 lg:col-span-2 space-y-4">
					{/* Shipping */}
					<div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
						<div className="p-5 border-b border-slate-200 flex items-center justify-between">
							<div>
								<h2 className="text-xl font-extrabold text-slate-900">عنوان الشحن</h2>
								<p className="text-sm text-slate-500 mt-1">اختر العنوان المناسب أو أضف عنوان جديد.</p>
							</div>

							<button
								onClick={() => setOpenModal(true)}
								className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100"
							>
								<FiPlus />
								أضف عنوان
							</button>

							<AddressForm open={openModal} onClose={() => setOpenModal(false)} onSuccess={handleNewAddress} />
						</div>

						<div className="p-5">
							{addrLoading ? (
								<BlockSkeleton />
							) : (
								<>
									{/* Selected summary */}
									<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
										<p className="text-slate-700 font-extrabold">
											التوصيل إلى:{" "}
											<span className="text-slate-900">
												{selectedAddress ? `${(selectedAddress as any).city} - ${(selectedAddress as any).area}` : "لم يتم اختيار عنوان"}
											</span>
										</p>

										{selectedAddress && (
											<div className="mt-2 text-sm text-slate-600 space-y-1">
												<p>{(selectedAddress as any).details}</p>
												<p className="font-semibold">
													{(selectedAddress as any).full_name} {(selectedAddress as any).phone ? `- ${(selectedAddress as any).phone}` : ""}
												</p>
											</div>
										)}

										<div className="mt-3 flex items-center justify-between">
											<button
												onClick={handleAddressChange}
												className="text-pro-max font-extrabold underline underline-offset-4"
											>
												{showAddress ? "إخفاء العناوين" : "تغيير العنوان"}
											</button>

											{selectedAddress && (
												<span className="text-xs font-extrabold rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
													عنوان محدد
												</span>
											)}
										</div>
									</div>

									{/* Address list */}
									{showAddress && addresses.length > 0 && (
										<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
											{addresses.map((address) => {
												const active = selectedAddress?.id === address.id;
												return (
													<button
														key={address.id}
														onClick={() => handleSelectAddress(address)}
														className={`text-right rounded-3xl border p-4 transition ${
															active ? "border-pro-max bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
														}`}
													>
														<div className="flex items-start justify-between gap-2">
															<div>
																<p className="font-extrabold text-slate-900">{(address as any).full_name}</p>
																<p className="text-sm text-slate-600 mt-1">
																	{(address as any).city} - {(address as any).area}
																</p>
															</div>
															<span
																className={`text-xs font-extrabold rounded-full px-3 py-1 border ${
																	active ? "bg-white border-pro-max text-pro-max" : "bg-slate-50 border-slate-200 text-slate-600"
																}`}
															>
																{active ? "محدد" : "اختر"}
															</span>
														</div >
														<p className="text-sm text-slate-600 mt-2">{(address as any).details}</p>
														{/* 
														 */}
														 <div className="flex items-center justify-between">
															{(address as any).phone && <p className="text-xs text-slate-500 mt-2">{(address as any).phone}</p>
														}
														<div className="flex ittems-center gap-1">
															<p className="text-xs text-slate-500 mt-2">  رسوم الشحن</p>
														<p className="text-xs text-slate-500 mt-2">10 ريال</p>
														</div>
														 </div>
													</button>
												);
											})}
										</div>
									)}

									{/* Notes */}
									<div className="mt-5">
										<label className="text-sm font-extrabold text-slate-700">ملاحظات (اختياري)</label>
										<textarea
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											placeholder="مثال: الرجاء الاتصال قبل التوصيل..."
											className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-pro-max"
											rows={3}
										/>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Payment */}
					<div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
						<div className="p-5 border-b border-slate-200">
							<h2 className="text-xl font-extrabold text-slate-900">اختر طريقة الدفع</h2>
							<p className="text-sm text-slate-500 mt-1">اختر الطريقة الأنسب لإتمام الطلب.</p>
						</div>
						<div className="p-5">
							<BankPayment paymentMethods={paymentMethods} onPaymentMethodChange={setPaymentMethod} />
						</div>
					</div>
				</div>

				{/* Right summary */}
				<div className="col-span-1 space-y-4 lg:sticky lg:top-[150px] h-fit">
					 

					<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
						<InvoiceSection />
					</div>

					<div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
						{/* <OrderSummary /> */}

						{/* ✅ Same total summary from cart, using checkout_summary_v1 */}
						<div className="mt-4">
							<h4 className="text-md font-extrabold text-pro mb-3">ملخص الطلب</h4>

							{checkoutSummary ? (
								<SummaryBlock summary={checkoutSummary} />
							) : (
								<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
									<p className="font-extrabold text-amber-800 text-sm">
										لا يوجد ملخص للطلب (checkout_summary_v1) — ارجع للسلة ثم ادخل صفحة الدفع مرة أخرى.
									</p>
								</div>
							)}
						</div>

						<div className="mt-4">
							<Button
								variant="contained"
								disabled={loading || !paymentMethod || !checkoutSummary}
								sx={{
									fontSize: "1.1rem",
									backgroundColor: loading ? "#9ca3af" : "#14213d",
									"&:hover": { backgroundColor: loading ? "#9ca3af" : "#0f1a31" },
									color: "#fff",
									gap: "10px",
									px: "20px",
									py: "12px",
									borderRadius: "16px",
									textTransform: "none",
									width: "100%",
									fontWeight: 900,
								}}
								endIcon={<KeyboardBackspaceIcon />}
								onClick={handleCompletePurchase}
							>
								{loading ? "جاري المعالجة..." : "إتمام الشراء"}
							</Button>

							{!paymentMethod && (
								<p className="text-red-500 text-center mt-2 text-sm font-semibold">يرجى اختيار طريقة الدفع أولًا</p>
							)}

							{!checkoutSummary && (
								<p className="text-amber-700 text-center mt-2 text-sm font-semibold">ملخص الطلب غير موجود</p>
							)}
						</div>
					</div>
				</div>
			</div>

			<LoadingOverlay show={redirecting} message={redirectMessage} />
		</div>
	);
}

function getPaymentMethodText(method: string) {
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
