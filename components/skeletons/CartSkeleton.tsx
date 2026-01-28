"use client";

function Skel({ className = "" }: { className?: string }) {
	return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export default function CartSkeleton() {
	return (
		<div className="container pb-8 pt-5" dir="rtl">
			<div className="flex items-center gap-2 text-sm mb-4">
				<Skel className="h-4 w-16" />
				<Skel className="h-4 w-4 rounded-full" />
				<Skel className="h-4 w-24" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
				{/* items */}
				<div className="col-span-1 lg:col-span-2 space-y-4">
					{[1, 2].map((i) => (
						<div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
							<div className="flex gap-4">
								<Skel className="w-24 h-20 rounded-2xl" />
								<div className="flex-1 space-y-3">
									<Skel className="h-5 w-2/3" />
									<Skel className="h-4 w-1/3" />
									<div className="flex gap-2">
										<Skel className="h-9 w-28 rounded-xl" />
										<Skel className="h-9 w-28 rounded-xl" />
										<Skel className="h-9 w-28 rounded-xl" />
									</div>
								</div>
								<Skel className="h-9 w-9 rounded-full" />
							</div>

							<div className="mt-4">
								<Skel className="h-10 w-full rounded-2xl" />
								<Skel className="h-10 w-full rounded-2xl mt-2" />
								<Skel className="h-10 w-2/3 rounded-2xl mt-2" />
							</div>
						</div>
					))}
				</div>

				{/* summary */}
				<div className="col-span-1">
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
						<Skel className="h-5 w-24" />
						<Skel className="h-10 w-full rounded-2xl mt-4" />
						<Skel className="h-10 w-full rounded-2xl mt-2" />

						<div className="mt-6 space-y-3">
							<div className="flex justify-between">
								<Skel className="h-4 w-24" />
								<Skel className="h-4 w-16" />
							</div>
							<div className="flex justify-between">
								<Skel className="h-4 w-28" />
								<Skel className="h-4 w-20" />
							</div>
							<div className="h-px bg-slate-200" />
							<div className="flex justify-between">
								<Skel className="h-5 w-24" />
								<Skel className="h-6 w-24" />
							</div>
						</div>

						<Skel className="h-12 w-full rounded-2xl mt-6" />
					</div>
				</div>
			</div>
		</div>
	);
}
