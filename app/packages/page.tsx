"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

type Pkg = {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  background_image?: string | null;
  products_count?: number;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/packages`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (alive) setPackages(d?.data || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <section dir="rtl" className="container py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900">باكدجات</h1>
        <p className="mt-3 text-sm md:text-base text-slate-600">
          باكدجات مختارة تجمع لك أفضل المنتجات بأسعار وكميات جاهزة.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 font-bold">
          لا توجد باكدجات متاحة حاليًا.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/packages/${pkg.id}`}
              className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="relative h-52 bg-slate-50">
                {pkg.image ? (
                  <Image src={pkg.image} alt={pkg.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-contain p-3" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-4xl">🎁</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-extrabold text-lg text-slate-900 line-clamp-1">{pkg.name}</h3>
                {pkg.description ? (
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{pkg.description}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{pkg.products_count || 0} منتجات</span>
                  <span className="text-sm font-extrabold text-pro">عرض الباقة ←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
