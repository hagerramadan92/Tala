export default function Loading() {
  return (
    <div className="container !mt-10 !mb-14">
      <div className="h-4 w-40 rounded bg-slate-100 animate-pulse mb-4" />

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="h-[240px] md:h-[380px] bg-slate-100 animate-pulse" />

        <div className="p-5 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-6 w-44 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-[90%] rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-[80%] rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-[70%] rounded bg-slate-100 animate-pulse" />

              <div className="mt-6 h-48 rounded-3xl bg-slate-100 animate-pulse" />
            </div>

            <div className="lg:col-span-4">
              <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
            </div>
          </div>

          <div className="mt-12">
            <div className="h-6 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="mt-6 flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[70%] sm:w-[45%] md:w-[32%] lg:w-[24%] xl:w-[20%] shrink-0"
                >
                  <div className="h-[320px] rounded-3xl bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
