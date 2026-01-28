"use client";

import Image from "next/image";
import Link from "next/link";
import BlogSlider from "../BlogSlider";
import CommentsSection from "./CommentsSection";
import { Article } from "../BlogCard";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ArticleDetails = Article & {
  views_count?: number;
  is_featured?: boolean;
  author?: { id: number; name: string; avatar: string | null };
  tags?: { id: number; name: string; slug: string }[];
  comments_count?: number;
};

type ArticleDetailsRes = { status: boolean; data: ArticleDetails };
type ArticleListRes = { status: boolean; data: Article[] };

async function apiGet<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) return null;
  return json as T;
}

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d.replace(" ", "T")).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function Sk({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5 animate-pulse",
        className
      )}
    />
  );
}

function DetailsSkeleton() {
  return (
    <div className="container !mt-8 !mb-14">
      <div className="flex items-center gap-2 text-sm mb-4">
        <Sk className="h-4 w-16" />
        <Sk className="h-4 w-6" />
        <Sk className="h-4 w-64" />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="relative h-[260px] md:h-[420px] bg-slate-100">
          <Sk className="absolute inset-0 rounded-none" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10 space-y-3">
            <div className="flex gap-2">
              <Sk className="h-7 w-24 bg-white/30 rounded-full" />
              <Sk className="h-7 w-24 bg-white/30 rounded-full" />
            </div>
            <Sk className="h-10 w-[70%] bg-white/30" />
            <Sk className="h-4 w-[55%] bg-white/30" />
          </div>
        </div>

        <div className="p-5 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 space-y-3">
                <Sk className="h-5 w-28" />
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-[92%]" />
                <Sk className="h-4 w-[70%]" />
              </div>

              <div className="space-y-3">
                <Sk className="h-4 w-24" />
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Sk key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-6">
                <Sk className="h-5 w-32" />
                <Sk className="mt-4 h-24 w-full" />
                <div className="mt-4 flex justify-between">
                  <Sk className="h-4 w-44" />
                  <Sk className="h-10 w-28" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 sticky top-6 space-y-3">
                <Sk className="h-5 w-28" />
                <Sk className="h-11 w-full" />
                <Sk className="h-11 w-full" />
                <Sk className="h-20 w-full" />
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Sk className="h-6 w-44" />
            <Sk className="mt-2 h-4 w-64" />
            <div className="mt-6 flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Sk key={i} className="h-[320px] w-[260px] rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogDetailsPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setNotFoundState(false);

      try {
        if (!slug) {
          if (!mounted) return;
          setNotFoundState(true);
          return;
        }

        const [detailsRes, relatedRes] = await Promise.all([
          apiGet<ArticleDetailsRes>(`/articles/${encodeURIComponent(slug)}`),
          apiGet<ArticleListRes>(`/articles/${encodeURIComponent(slug)}/related`),
        ]);

        if (!mounted) return;

        const a = detailsRes?.data || null;
        if (!a) {
          setNotFoundState(true);
          return;
        }

        setArticle(a);
        setRelated(relatedRes?.data || []);
      } catch {
        if (!mounted) return;
        setNotFoundState(true);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const pageTitle = useMemo(
    () => article?.title || "تفاصيل المقال",
    [article]
  );

  if (loading) return <DetailsSkeleton />;

  if (notFoundState || !article) {
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

  return (
    <div className="container !mt-8 !mb-14">
      {/* Breadcrumb */}
      <div className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
        <Link href="/blogs" className="hover:text-slate-800 transition">
          المدونة
        </Link>
        <span className="opacity-60">/</span>
        <span className="text-slate-700 line-clamp-1">{pageTitle}</span>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {/* Hero */}
        <div className="relative h-[260px] md:h-[420px] bg-slate-100">
          <Image
            src={article.image || "/images/d4.jpg"}
            alt={article.image_alt || article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* floating meta */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
            <div className="flex flex-wrap items-center gap-2">
              {article.category?.name ? (
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-slate-900 text-xs font-extrabold">
                  {article.category.name}
                </span>
              ) : null}

              {article.is_featured ? (
                <span className="px-3 py-1 rounded-full bg-amber-200/90 text-amber-950 text-xs font-extrabold">
                  ⭐ مقال مميز
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-white text-2xl md:text-4xl font-extrabold leading-tight drop-shadow">
              {article.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-white/90 text-xs font-bold">
              <span>{formatDate(article.published_at)}</span>
              <span className="opacity-60">•</span>
              <span>
                {article.reading_time
                  ? `${article.reading_time} دقيقة`
                  : "قراءة سريعة"}
              </span>
              <span className="opacity-60">•</span>
              <span>
                {article.views_count ? `${article.views_count} مشاهدة` : "—"}
              </span>
              {article.author?.name ? (
                <>
                  <span className="opacity-60">•</span>
                  <span>بقلم: {article.author.name}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <article className="lg:col-span-8">
              {/* Excerpt */}
              <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6 md:p-8">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
                  نبذة سريعة
                </h2>
                <p className="mt-2 text-slate-700 leading-relaxed">
                  {article.excerpt || "لا يوجد وصف للمقال حالياً."}
                </p>
              </div>

              {/* Tags */}
              {Array.isArray(article.tags) && article.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">
                    الوسوم
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((t) => (
                      <span
                        key={t.id}
                        className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="mt-10">
                <CommentsSection articleId={article.id} slug={article.slug} />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 sticky top-6">
                <h3 className="text-lg font-extrabold text-slate-900">
                  تفاصيل سريعة
                </h3>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold text-slate-500">عدد التعليقات</p>
                    <p className="mt-1 text-base font-extrabold text-slate-900">
                      {article.comments_count ?? 0}
                    </p>
                  </div>

                  <Link
                    href="/blogs"
                    className="rounded-2xl px-4 py-3 font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition text-center"
                  >
                    كل المقالات
                  </Link>

                  <Link
                    href="/contactUs"
                    className="rounded-2xl px-4 py-3 font-extrabold border border-slate-200 bg-white hover:bg-slate-50 transition text-center"
                  >
                    تواصل معنا
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                مقالات ذات صلة
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                قد تعجبك أيضًا هذه المقالات.
              </p>

              <div className="mt-6">
                <BlogSlider articles={related} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
