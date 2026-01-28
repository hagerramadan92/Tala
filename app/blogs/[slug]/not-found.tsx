import Link from "next/link";

export default function NotFound() {
	return (
		<div className="container !mt-16 !mb-16">
			<div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
				<h2 className="text-2xl font-extrabold text-slate-900">
					المقال غير موجود
				</h2>
				<p className="mt-2 text-slate-600 text-sm">
					قد يكون تم حذفه أو تغيير الرابط.
				</p>
				<Link
					href="/blogs"
					className="mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-3 font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition"
				>
					العودة للمدونة
				</Link>
			</div>
		</div>
	);
}
