export default function Loading() {
  return (
    <div dir="rtl" className="container py-12">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
          <div className="h-4 w-24 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="mt-4 h-8 w-2/3 rounded-xl bg-slate-200/70 animate-pulse" />
          <div className="mt-3 h-4 w-1/2 rounded-lg bg-slate-200/70 animate-pulse" />
        </div>

        <div className="p-6 md:p-8 space-y-3">
          <div className="h-4 w-full rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-11/12 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-10/12 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-32 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-9/12 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-11/12 rounded-lg bg-slate-200/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
