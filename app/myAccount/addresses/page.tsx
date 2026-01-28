"use client";

import AddressForm from "@/components/AddressForm";
import { AddressI } from "@/Types/AddressI";
import { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";

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

function AddressListSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="space-y-4 mt-6" dir="rtl">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
					<div className="p-4 bg-slate-50 flex items-center justify-between">
						<div className="space-y-2">
							<Sk className="h-5 w-44" />
							<Sk className="h-4 w-28" />
						</div>
						<div className="flex gap-2">
							<Sk className="h-9 w-9 rounded-xl" />
							<Sk className="h-9 w-9 rounded-xl" />
						</div>
					</div>
					<div className="p-4 space-y-2">
						<Sk className="h-4 w-52" />
						<Sk className="h-4 w-full" />
						<Sk className="h-4 w-40" />
					</div>
				</div>
			))}
		</div>
	);
}

export default function Page() {
	const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
	const [open, setOpen] = useState(false);
	const [editingAddress, setEditingAddress] = useState<AddressI | null>(null);

	const [addresses, setAddresses] = useState<AddressI[]>([]);
	const [token, setToken] = useState<string | null>(null);
	const [loadingList, setLoadingList] = useState<boolean>(true);

	const base_url = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		const t = localStorage.getItem("auth_token");
		setToken(t);
	}, []);

	useEffect(() => {
		if (!token) return;

		const fetchAddresses = async () => {
			setLoadingList(true);
			try {
				const res = await fetch(`${base_url}/addresses`, {
					headers: {
						Accept: "application/json",
						Authorization: `Bearer ${token}`,
					},
					cache: "no-store",
				});

				const result = await res.json().catch(() => null);
				if (res.ok && result?.status) setAddresses(result.data || []);
				else setAddresses([]);
			} catch (err) {
				console.error(err);
				setAddresses([]);
			} finally {
				setLoadingList(false);
			}
		};

		fetchAddresses();
	}, [token, base_url]);

	const handleNewAddress = (newAddress: AddressI) => {
		setAddresses((prev) => {
			const exists = prev.find((a) => a.id === newAddress.id);
			if (exists) return prev.map((a) => (a.id === newAddress.id ? newAddress : a));
			return [newAddress, ...prev];
		});
	};

	const handleDelete = async (id: number) => {
		if (!token) {
			Swal.fire("تنبيه", "يجب تسجيل الدخول", "warning");
			return;
		}

		const result = await Swal.fire({
			title: "هل أنت متأكد؟",
			text: "لن تتمكن من التراجع عن الحذف!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "نعم، احذف",
			cancelButtonText: "إلغاء",
		});

		if (!result.isConfirmed) return;

		try {
			const res = await fetch(`${base_url}/addresses/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			const data = await res.json().catch(() => null);
			if (!res.ok || !data?.status) throw new Error(data?.message || "حدث خطأ");

			setAddresses((prev) => prev.filter((a) => a.id !== id));
			if (selectedAddress === id) setSelectedAddress(null);

			Swal.fire("تم الحذف!", "تم حذف العنوان بنجاح.", "success");
		} catch (err: any) {
			Swal.fire("خطأ", err?.message || "حدث خطأ أثناء الحذف", "error");
		}
	};

	const handleEdit = (address: AddressI) => {
		setEditingAddress(address);
		setOpen(true);
	};

	return (
		<div dir="rtl" className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
				<div className="flex items-start md:items-center justify-between gap-3">
					<div>
						<h2 className="text-slate-900 font-extrabold text-xl md:text-2xl">
							إدارة العناوين
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							أضف عنوانًا جديدًا أو عدّل عناوينك الحالية بسهولة.
						</p>
					</div>

					<button
						onClick={() => {
							setEditingAddress(null);
							setOpen(true);
						}}
						className="inline-flex items-center gap-2 rounded-xl bg-pro px-4 py-3 text-sm font-extrabold text-white hover:opacity-95 active:scale-[0.99] transition"
					>
						<FiPlus size={18} />
						إضافة عنوان
					</button>
				</div>
			</div>

			<AddressForm
				open={open}
				onClose={() => setOpen(false)}
				initialData={editingAddress || undefined}
				onSuccess={handleNewAddress}
			/>

			{/* List */}
			{loadingList ? (
				<AddressListSkeleton count={4} />
			) : addresses.length > 0 ? (
				<div className="space-y-4">
					{addresses.map((item) => {
						const active = selectedAddress === item.id;

						return (
							<div
								key={item.id}
								onClick={() => setSelectedAddress(item.id)}
								className={`cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition
                  ${active ? "border-pro ring-2 ring-pro/10" : "border-slate-200 hover:border-slate-200"}
                `}
							>
								<div
									className={`flex items-center justify-between p-4 border-b border-slate-200
                    ${active ? "bg-pro/5" : "bg-slate-50"}
                  `}
								>
									<div className="min-w-0">
										<h4 className="text-slate-900 font-extrabold text-base md:text-lg truncate">
											{item.city} - {item.area}
										</h4>
										<p className="text-xs md:text-sm font-semibold text-slate-500">
											{item.label || "عنوان"}
										</p>
									</div>

									<div className="flex gap-2">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleEdit(item);
											}}
											className="grid place-items-center h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200 text-pro hover:bg-slate-50 transition"
											aria-label="edit"
										>
											<FiEdit size={18} />
										</button>

										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDelete(item.id);
											}}
											className="grid place-items-center h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200 text-rose-600 hover:bg-rose-50 transition"
											aria-label="delete"
										>
											<FiTrash2 size={18} />
										</button>
									</div>
								</div>

								<div className="p-4 space-y-1">
									<p className="text-slate-900 font-bold">{item.full_name}</p>
									<p className="text-slate-600 text-sm font-semibold">{item.details}</p>
									<p className="text-slate-600 text-sm font-semibold">{item.phone}</p>

									{active && (
										<div className="pt-3">
											<span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 px-3 py-1 text-xs font-extrabold">
												العنوان المحدد
											</span>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-center">
					<p className="text-slate-700 font-extrabold">لا يوجد عناوين لعرضها</p>
					<p className="mt-2 text-sm text-slate-500">
						اضغط على "إضافة عنوان" لإضافة عنوانك الأول.
					</p>
				</div>
			)}
		</div>
	);
}
