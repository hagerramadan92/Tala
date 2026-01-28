"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Comment = {
  id: number;
  content: string;
  created_at?: string;
  user?: { name?: string };
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

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function CommentsSection({
  articleId,
  slug,
}: {
  articleId: number;
  slug: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [content, setContent] = useState("");

  // ✅ new: identity
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);

  // load identity from localStorage
  useEffect(() => {
    try {
      const n = localStorage.getItem("userName") || "";
      const e = localStorage.getItem("userEmail") || "";
      setName(n);
      setEmail(e);
    } catch {
      // ignore
    }
  }, []);

  const needIdentity = useMemo(() => !name.trim() || !email.trim(), [name, email]);

  const loadComments = async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/articles/${slug}/comments`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.status)
        throw new Error(json?.message || "فشل تحميل التعليقات");

      setComments(Array.isArray(json.data) ? json.data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submit = async () => {
    setMsg(null);

    if (!content.trim()) {
      setMsg("اكتب تعليقك أولاً.");
      return;
    }

    // ✅ if no identity, ask for it
    if (!name.trim()) {
      setMsg("من فضلك اكتب اسمك.");
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setMsg("من فضلك اكتب بريد إلكتروني صحيح.");
      return;
    }

    if (!API_URL) {
      setMsg("API غير متاح.");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("auth_token");

      // ✅ save to localStorage for next time
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userEmail", email.trim());

      const res = await fetch(`${API_URL}/articles/comments`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          article_id: articleId,
          content: content.trim(),
          parent_id: null, // لو عندك replies خليها رقم
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.status)
        throw new Error(json?.message || "فشل إرسال التعليق");

      setContent("");
      setMsg("✅ تم إرسال تعليقك بنجاح");
      await loadComments();
    } catch (e: any) {
      setMsg(e?.message || "حدث خطأ أثناء إرسال التعليق");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="p-5 md:p-7">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900">
              التعليقات
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              شارك رأيك—يسعدنا سماعك.
            </p>
          </div>

          <button
            onClick={loadComments}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-extrabold hover:bg-slate-100 transition"
          >
            تحديث
          </button>
        </div>

        {/* Add */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 md:p-5">
          {/* identity form if missing */}
          {needIdentity && (
            <div className="mb-4 grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-800">
                  الاسم
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-800">
                  البريد الإلكتروني
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  inputMode="email"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-slate-200"
                />
              </div>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="اكتب تعليقك هنا..."
            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-slate-200 resize-none"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            {msg ? (
              <p className="text-sm font-bold text-slate-700">{msg}</p>
            ) : (
              <span />
            )}

            <button
              onClick={submit}
              disabled={sending}
              className={cn(
                "px-5 py-2.5 rounded-2xl font-extrabold text-sm text-white transition",
                sending
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-pro hover:opacity-95 active:scale-[0.99]"
              )}
            >
              {sending ? "جارٍ الإرسال..." : "إرسال"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              <Sk className="h-20" />
              <Sk className="h-20" />
              <Sk className="h-20" />
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
              لا توجد تعليقات بعد—كن أول من يعلّق ✨
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-2xl bg-slate-100 grid place-items-center text-slate-600 font-extrabold">
                        {(c.user?.name || "م")[0]}
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {c.user?.name || "مستخدم"}
                      </p>
                    </div>

                    <p className="text-xs font-bold text-slate-500">
                      {formatDate(c.created_at)}
                    </p>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
