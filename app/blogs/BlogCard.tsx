import Image from "next/image";
import Link from "next/link";

export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  image_alt?: string;
  reading_time?: number;
  published_at?: string;
  category?: { id: number; name: string; slug: string };
};

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d.replace(" ", "T")).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export default function BlogCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blogs/${article.slug}`}
      className="group block rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
    >
      <div className="relative h-[180px] bg-slate-100">
        <Image
          src={article.image || "/images/d4.jpg"}
          alt={article.image_alt || article.title}
          fill
          className="object-cover group-hover:scale-[1.03] transition duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

        {article.category?.name ? (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur text-slate-800 text-xs font-extrabold">
              {article.category.name}
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="text-sm md:text-base font-extrabold text-slate-900 line-clamp-2">
          {article.title}
        </h3>

        {article.excerpt ? (
          <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>{formatDate(article.published_at)}</span>
          <span className="text-slate-700">
            {article.reading_time ? `${article.reading_time} د` : "قراءة سريعة"}
          </span>
        </div>

        <div className="mt-3 h-[2px] w-0 bg-slate-900/10 group-hover:w-full transition-all" />
      </div>
    </Link>
  );
}
