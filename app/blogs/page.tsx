import Image from "next/image";
import BlogSlider from "./BlogSlider";
import { Article } from "./BlogCard";
import ImageWithFallback from "@/components/ImageFallback/ImageWithFallback";

type CategoryWithArticles = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order?: number;
  articles: Article[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// دالة مساعدة لمعالجة مسار الصورة
function getImageUrl(imagePath?: string): string {
  if (!imagePath) return "/images/not.jpg";
  
  // إذا كان المسار كامل (يبدأ بـ http)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // إذا كان المسار نسبي، أضف الـ API_URL
  if (API_URL) {
    // إزالة الـ slash الزائد إذا وجد
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}`;
  }
  
  return "/images/not.jpg";
}

async function apiGet<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;

  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) return null;

  return json as T;
}

export default async function BlogsPage() {
  const [featuredRes, popularRes, catsRes] = await Promise.all([
    apiGet<{ status: boolean; data: Article[] }>("/articles/featured"),
    apiGet<{ status: boolean; data: Article[] }>("/articles/popular"),
    apiGet<{ status: boolean; data: CategoryWithArticles[] }>(
      "/article-categories/with-counts"
    ),
  ]);

  const featured = featuredRes?.data || [];
  const popular = popularRes?.data || [];
  const categories = (catsRes?.data || []).filter(
    (c) => (c.articles || []).length > 0
  );

  return (
    <div className="container !mt-10 !mb-14">
      {/* Hero */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="relative p-6 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50" />
          <div className="relative">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900">
              المدونة
            </h1>
            <p className="mt-3 text-slate-600 text-sm md:text-base max-w-2xl">
              مقالات ونصائح عن التطريز والطباعة والتصميم—كل جديد في مكان واحد.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                مميزة
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                الأكثر مشاهدة
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                حسب الأقسام
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="p-5 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
              مقالات مميزة ⭐
            </h2>
            <p className="mt-1 text-sm text-slate-600">اختياراتنا الأفضل لك.</p>

            <div className="mt-6">
              <BlogSlider articles={featured} />
            </div>
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="p-5 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
              الأكثر مشاهدة 🔥
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              المقالات التي يقرأها الجميع الآن.
            </p>

            <div className="mt-6">
              <BlogSlider articles={popular} />
            </div>
          </div>
        </section>
      )}

      {/* Categories sections */}
      <div className="mt-10 flex flex-col gap-10">
        {categories.map((cat) => (
          <section
            key={cat.id}
            className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden"
          >
            <div className="relative h-[120px] md:h-[160px]">
              <ImageWithFallback
                src={getImageUrl(cat.image)}
                alt={cat.name}
                fill
                className="object-cover"
                fallbackSrc="/images/not.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <h2 className="text-white text-lg md:text-2xl font-extrabold drop-shadow">
                    {cat.name}
                  </h2>
                  {cat.description ? (
                    <p className="mt-1 text-white/90 text-xs md:text-sm max-w-2xl line-clamp-2">
                      {cat.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8">
              <BlogSlider articles={cat.articles || []} />
            </div>
          </section>
        ))}
      </div>

      {/* empty fallback */}
      {featured.length === 0 && popular.length === 0 && categories.length === 0 && (
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500 font-bold">
          لا توجد مقالات حالياً.
        </div>
      )}
    </div>
  );
}