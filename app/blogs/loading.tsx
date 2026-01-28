export default function Loading() {
  return (
    <div className="container !mt-10 !mb-14">
      {/* Hero skeleton */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-6 md:p-10">
          <div className="h-8 md:h-10 w-40 rounded-xl bg-slate-100 animate-pulse" />
          <div className="mt-4 h-4 w-[70%] rounded bg-slate-100 animate-pulse" />
          <div className="mt-2 h-4 w-[55%] rounded bg-slate-100 animate-pulse" />

          <div className="mt-6 flex gap-2">
            <div className="h-7 w-16 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-7 w-24 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-7 w-20 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Slider skeleton blocks */}
      {Array.from({ length: 3 }).map((_, s) => (
        <section
          key={s}
          className="mt-8 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-5 md:p-8">
            <div className="h-6 w-44 rounded bg-slate-100 animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-slate-100 animate-pulse" />

            <div className="mt-6 flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[70%] sm:w-[45%] md:w-[32%] lg:w-[24%] xl:w-[20%] shrink-0"
                >
                  <div className="h-[320px] rounded-3xl border border-slate-100 bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
