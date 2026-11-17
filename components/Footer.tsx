"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/src/context/AppContext";
import { fetchApi } from "@/lib/api";
import {
  FaPhone,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInstagram,
  FaSnapchat,
  FaTelegram,
  FaYoutube,
  FaPinterest,
  FaTiktok,
  FaReddit,
  FaDiscord,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaCcApplePay,
  FaCcAmex,
  FaCcDiscover,
  FaCcStripe,
  FaCreditCard,
  FaMoneyBill,
} from "react-icons/fa";

import Image from "next/image";

type SocialItem = { key: string; value: any; icon?: string };
type PaymentMethod = { id: number; name: string; icon?: string; image?: string; is_active: boolean };

function isEmptyValue(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v !== "string") return false;
  return v.trim().length === 0;
}

function normalizeSocialHref(key: string, value: string) {
  const v = value.trim();

  if (key === "phone") return v.startsWith("tel:") ? v : `tel:${v}`;

  if (key === "email") return v.startsWith("mailto:") ? v : `mailto:${v}`;

  if (key === "whatsapp") {
    if (v.startsWith("http")) return v;
    const digits = v.replace(/[^\d+]/g, "");
    const wa = digits.startsWith("+") ? digits.slice(1) : digits;
    return `https://wa.me/${wa}`;
  }

  if (key === "snapchat") {
    if (v.startsWith("http")) return v;
    const username = v.replace(/^@/, "");
    return `https://www.snapchat.com/add/${username}`;
  }

  if (key === "address") return "";

  if (v.startsWith("http")) return v;
  return `https://${v}`;
}

function normalizeSocialKey(key: string) {
  const normalizedKey = key.trim().toLowerCase().replace(/[_-]+/g, "");

  if (normalizedKey === "snap" || normalizedKey === "snapchat" || normalizedKey === "snapchaturl") {
    return "snapchat";
  }

  return key;
}

// خريطة لربط أسماء طرق الدفع بالصور
const paymentImagesMap: Record<string, string> = {
  "الدفع عند الاستلام": "/images/payments/cod.png",
  "بطاقات بنكيه": "/images/payments/card.jpg",
  "بطاقات بنكية": "/images/payments/card.jpg",
  "بطاقات بنكية و Apple Pay": "/images/payments/card.jpg",
  "بطاقات بنكية و apple pay": "/images/payments/card.jpg",
  "paymob": "/images/payments/paymob.png",
  "Paymob": "/images/payments/paymob.png",
  "tabby": "/images/payments/tabby.jpeg",
  "Tabby": "/images/payments/tabby.jpeg",
  "tamara": "/images/payments/tamara.png",
  "Tamara": "/images/payments/tamara.png",
  "sbc": "/images/sbc.avif",
  "SBC": "/images/sbc.avif",
  "stc pay": "/images/stc_pay_mini.webp",
  "STC Pay": "/images/stc_pay_mini.webp",
  "stcPay": "/images/stc_pay_mini.webp",
  "اس تي سي باي": "/images/stc_pay_mini.webp",
  "mada": "/images/mada_mini.png",
  "Mada": "/images/mada_mini.png",
  "مدى": "/images/mada_mini.png",
  "apple pay": "/images/payments/apple-pay.png",
  "Apple Pay": "/images/payments/apple-pay.png",
  "applePay": "/images/payments/apple-pay.png",
  "applepay": "/images/payments/apple-pay.png",
  "ابل باي": "/images/payments/apple-pay.png",
};

// خريطة لربط طرق الدفع برابط خارجي إذا لزم الأمر
const paymentLinksMap: Record<string, string> = {
  "sbc": "https://qr.saudibusiness.gov.sa/viewcr?nCrNumber=khRFqz0XWeB9RSyhLP7KdQ==",
  "SBC": "https://qr.saudibusiness.gov.sa/viewcr?nCrNumber=khRFqz0XWeB9RSyhLP7KdQ==",
};

// خريطة لتحويل أيقونات Font Awesome إلى صور
const faIconToImageMap: Record<string, string> = {
  'fa-money-bill-wave': '/images/payments/cod.png',
  'fa-university': '/images/payments/card.jpg',
  'fa-credit-card': '/images/payments/card.jpg',
};

// Map payment method names/identifiers to React Icons
const paymentIconsMap: Record<string, any> = {
  visa: FaCcVisa,
  "credit-card": FaCreditCard,
  mastercard: FaCcMastercard,
  paypal: FaCcPaypal,
  "apple-pay": FaCcApplePay,
  amex: FaCcAmex,
  discover: FaCcDiscover,
  stripe: FaCcStripe,
  cash: FaMoneyBill,
  money: FaMoneyBill,
};

function getPaymentImagePath(paymentName: string) {
  const exactPath = paymentImagesMap[paymentName];
  if (exactPath) return exactPath;

  const normalizedName = paymentName.trim().toLowerCase().replace(/[_-]+/g, " ");
  return paymentImagesMap[normalizedName] || paymentImagesMap[paymentName.trim()];
}

function getPaymentIcon(iconName: string | undefined, paymentName: string) {
  // أولاً: البحث في خريطة الصور حسب اسم طريقة الدفع
  const imagePath = getPaymentImagePath(paymentName);
  if (imagePath) {
    return () => (
      <div className="relative h-7 w-11 md:h-5 md:w-8">
        <Image
          src={imagePath}
          alt={paymentName}
          fill
          className="object-contain"
          sizes="32px"
        />
      </div>
    );
  }

  // ثانياً: إذا كان iconName موجود ويبدأ بـ 'fas ' (أيقونة Font Awesome)
  if (iconName && iconName.startsWith('fas ')) {
    const faIcon = iconName.replace('fas ', '');
    const mappedImage = faIconToImageMap[faIcon];
    
    if (mappedImage) {
      return () => (
        <div className="relative h-7 w-11 md:h-5 md:w-8">
          <Image
            src={mappedImage}
            alt={paymentName}
            fill
            className="object-contain"
            sizes="32px"
          />
        </div>
      );
    }
  }

  // إذا كان iconName رابط صورة مباشر
  if (iconName && (iconName.startsWith('http') || iconName.startsWith('/'))) {
    // رابط خارجي (دومين الداشبورد) → img عادي عشان Next/Image بيمنع الدومينات غير المسجلة
    if (iconName.startsWith('http')) {
      return () => (
        <div className="relative h-7 w-11 md:h-5 md:w-8">
          <img src={iconName} alt={paymentName} className="h-full w-full object-contain" loading="lazy" />
        </div>
      );
    }

    return () => (
      <div className="relative h-7 w-11 md:h-5 md:w-8">
        <Image
          src={iconName}
          alt={paymentName}
          fill
          className="object-contain"
          sizes="32px"
        />
      </div>
    );
  }

  // إذا لم نجد صورة، نستخدم الأيقونات المعتادة
  if (!iconName) {
    const lowerName = paymentName.toLowerCase();
    if (lowerName.includes("visa")) return FaCcVisa;
    if (lowerName.includes("mastercard")) return FaCcMastercard;
    if (lowerName.includes("paypal")) return FaCcPaypal;
    if (lowerName.includes("apple")) return FaCcApplePay;
    if (lowerName.includes("amex") || lowerName.includes("american express")) return FaCcAmex;
    if (lowerName.includes("discover")) return FaCcDiscover;
    if (lowerName.includes("stripe")) return FaCcStripe;
    return FaCreditCard;
  }

  const lowerIcon = iconName.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return paymentIconsMap[lowerIcon] || FaCreditCard;
}

function PaymentChip({ method, fluid = false }: { method: any; fluid?: boolean }) {
  const PaymentIcon = getPaymentIcon(method.image || method.icon, method.name);
  const isImageComponent =
    typeof PaymentIcon === 'function' &&
    (PaymentIcon.toString().includes('Image') ||
      PaymentIcon.toString().includes('img') ||
      getPaymentImagePath(method.name) ||
      (method.icon && method.icon.startsWith('fas ')));

  const paymentLink = paymentLinksMap[method.name];
  const Element = paymentLink ? 'a' : 'span';
  const elementProps = paymentLink
    ? { href: paymentLink, target: '_blank', rel: 'noreferrer' }
    : {};

  return (
    <Element
      className={[
        'inline-flex items-center justify-center gap-1 md:gap-2 rounded-full bg-white/10',
        'px-2 md:px-3 py-2 text-[10px] md:text-xs font-bold ring-1 ring-white/10',
        'hover:bg-white/15 transition text-center leading-tight',
        fluid ? 'w-full' : '',
      ].join(' ')}
      title={method.name}
      {...elementProps}
    >
      {isImageComponent ? (
        <PaymentIcon />
      ) : (
        <PaymentIcon className="text-sm opacity-90" />
      )}
      <span className="hidden md:inline">{method.name}</span>
    </Element>
  );
}

export default function Footer() {
  const { socialMedia, paymentMethods } = useAppContext() as any;
  const [footerPaymentMethods, setFooterPaymentMethods] = useState<PaymentMethod[] | null>(null);

  const socials: SocialItem[] = useMemo(() => (
    Array.isArray(socialMedia) ? socialMedia : []
  ), [socialMedia]);
  const payments: PaymentMethod[] = useMemo(() => (
    footerPaymentMethods !== null
      ? footerPaymentMethods
      : Array.isArray(paymentMethods) ? paymentMethods : []
  ), [footerPaymentMethods, paymentMethods]);

  const socialIcons: Record<string, any> = {
    phone: FaPhone,
    whatsapp: FaWhatsapp,
    facebook: FaFacebook,
    twitter: FaTwitter,
    linkedin: FaLinkedin,
    instagram: FaInstagram,
    snapchat: FaSnapchat,
    telegram: FaTelegram,
    email: FaEnvelope,
    tiktok: FaTiktok,
    youtube: FaYoutube,
    pinterest: FaPinterest,
    reddit: FaReddit,
    discord: FaDiscord,
    address: FaMapMarkerAlt,
  };

  const Links = [
    { title: "معلومات عنا", href: "/about" },
    { title: "الشروط و الأحكام", href: "/terms" },
    { title: "سياسة الإسترجاع", href: "/returnsPolicy" },
    { title: "سياسة الخصوصية", href: "/policy" },
    { title: "الضمان", href: "/warranty" },
    // { title: "أنضم كشريك", href: "/partner" },
    // { title: "الفريق", href: "/team" },
    { title: "اتصل بنا", href: "/contactUs" },
  ];

  const companyLinks = Links.slice(0, 3);
  const importantLinks = Links.slice(3, 7);
  const helpLinks = Links.slice(7);

  const email = socials.find((s) => s.key === "email")?.value;
  const phone = socials.find((s) => s.key === "phone")?.value;
  const address = socials.find((s) => s.key === "address")?.value;

  // ✅ tax_id_number extracted separately
  const taxNumber = socials.find((s) => s.key === "tax_id_number")?.value;

  useEffect(() => {
    fetchApi("payment-methods")
      .then((res) => {
        setFooterPaymentMethods(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.error("Error loading footer payment methods:", err);
      });
  }, []);

  // ✅ show socials with value, except address + tax_id_number
  const socialButtons = useMemo(() => {
    return socials
      .filter((s) => !isEmptyValue(s.value))
      .filter((s) => s.key !== "address")
      .filter((s) => s.key !== "tax_id_number");
  }, [socials]);

  // ✅ active payments only
  const isSbcMethod = (p: any) => /sbc/i.test(String(p?.key || "")) || /sbc/i.test(String(p?.name || ""));

  const activePayments = useMemo(() => {
    // SBC بتتعرض جنب السجل التجاري تحت، مش في صف طرق الدفع.
    return payments.filter((p) => p?.is_active && !isSbcMethod(p));
  }, [payments]);

  // صفوف الموبايل: 3 في الأول، والباقي في النص، وآخر 3 تحت.
  const paymentRows = useMemo(() => {
    const all = activePayments;
    if (all.length === 0) return [] as any[][];
    if (all.length <= 3) return [all];

    const rows: any[][] = [all.slice(0, 3)];
    const rest = all.slice(3);

    if (rest.length <= 3) {
      rows.push(rest);
    } else {
      rows.push(rest.slice(0, rest.length - 3));
      rows.push(rest.slice(rest.length - 3));
    }

    return rows;
  }, [activePayments]);

  const year = new Date().getFullYear();

  return (
    <footer className="bg-pro text-white">
      <div className="container max-md:!px-6 px-5">
        {/* top */}
        <div className=" max-md:w-fit max-md:mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {/* Brand/About */}
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold">Tala Aliazeera</h3>
            <p className=" max-md:max-w-[200px] text-white/80 text-sm leading-relaxed">
              منصة تساعدك تشتري بسهولة، وتتابع طلباتك، وتوصل لمنتجاتك بأفضل تجربة.
            </p>

            {/* Quick actions */}
            <div className="flex  gap-2 pt-2">
              {!isEmptyValue(phone) && (
                <a
                  href={normalizeSocialHref("phone", String(phone))}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15 transition"
                  aria-label="اتصال بالدعم"
                >
                  <FaPhone className="opacity-90" />
                  <span>اتصل</span>
                </a>
              )}

              {!isEmptyValue(email) && (
                <a
                  href={normalizeSocialHref("email", String(email))}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15 transition"
                  aria-label="إرسال بريد"
                >
                  <FaEnvelope className="opacity-90" />
                  <span>بريد</span>
                </a>
              )}

              {!isEmptyValue(socials.find((s) => s.key === "whatsapp")?.value) && (
                <a
                  href={normalizeSocialHref("whatsapp", String(socials.find((s) => s.key === "whatsapp")!.value))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15 transition"
                  aria-label="واتساب"
                >
                  <FaWhatsapp className="opacity-90" />
                  <span>واتساب</span>
                </a>
              )}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-extrabold tracking-wide">الشركة</h4>
            <div className="mt-4 flex flex-col gap-3">
              {companyLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Important */}
          <div>
            <h4 className="text-sm font-extrabold tracking-wide">روابط مهمة</h4>
            <div className="mt-4 flex flex-col gap-3">
              {importantLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Help / Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold tracking-wide">تريد مساعدة؟</h4>

            <div className="flex flex-col gap-3">
              {helpLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              ))}
            </div>

            {/* Contact details */}
            <div className="mt-5 space-y-2 text-sm text-white/85">
              {!isEmptyValue(email) && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="opacity-80" />
                  <span className="break-all">{String(email)}</span>
                </div>
              )}

              {!isEmptyValue(phone) && (
                <div className="flex items-center gap-2">
                  <FaPhone className="opacity-80" />
                  <span className="tabular-nums">{String(phone)}</span>
                </div>
              )}

              {!isEmptyValue(address) && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="opacity-80 mt-0.5" />
                  <span className="leading-relaxed">{String(address)}</span>
                </div>
              )}

              {!email && !phone && !address && <p className="text-white/70">بيانات التواصل غير متاحة حالياً.</p>}
            </div>
          </div>
        </div>

        {/* divider */}
        <div className="h-px w-full bg-white/10" />

        {/* bottom */}
        <div className="grid max-md:w-fit max-md:mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-8">
          {/* payments */}
          <div className="space-y-2 lg:col-span-3">
            {/* ✅ tax number panel (NOT social) */}
            {!isEmptyValue(taxNumber) && (
              <div className="pt-4">
                <p className="text-sm font-extrabold">بيانات قانونية</p>

                <div className="mt-3 inline-flex items-center gap-4 md:gap-5 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                  <img
                    src="/images/saudi-emblem.svg"
                    alt="شعار المملكة العربية السعودية"
                    className="w-9 h-11 md:w-10 md:h-12 object-contain shrink-0"
                    loading="lazy"
                  />

                  <div className="text-center">
                    <p className="text-[11px] md:text-xs text-slate-500 font-bold">السجل التجاري</p>
                    <p className="mt-0.5 text-sm md:text-base font-extrabold text-slate-900 tabular-nums">7002362528</p>
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] md:text-xs text-slate-500 font-bold">الرقم الضريبي</p>
                    <p className="mt-0.5 text-sm md:text-base font-extrabold text-slate-900 tabular-nums">433334345</p>
                  </div>


                </div>
              </div>
            )}
          </div>

          {/* socials */}
          <div className="space-y-2">
            <p className="text-sm font-extrabold">تابعنا</p>

            <div className="flex items-center gap-2 flex-wrap">
              {socialButtons.length === 0 ? (
                <span className="text-white/70 text-sm">لا توجد روابط اجتماعية حالياً</span>
              ) : (
                socialButtons.map((social, idx) => {
                  const socialKey = normalizeSocialKey(social.key);
                  // واتساب مش بيتعرض في أيقونات "تابعنا"
                  if (socialKey === "whatsapp") return null;
                  const Icon = socialIcons[socialKey];
                  if (!Icon) return null;

                  const href = normalizeSocialHref(socialKey, String(social.value));
                  const isExternal = href.startsWith("http");
                  const target = isExternal ? "_blank" : undefined;

                  return (
                    <Link
                      key={`${social.key}-${idx}`}
                      href={href || "#"}
                      target={target}
                      rel={isExternal ? "noreferrer" : undefined}
                      className="group inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 transition ring-1 ring-white/10"
                      aria-label={socialKey}
                    >
                      <Icon className="text-white group-hover:scale-110 transition" size={18} />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* أسفل الفوتر: الحقوق + طرق الدفع في سطر واحد على الديسكتوب */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-white/10 pt-5 pb-8">
        <p className="text-center md:text-right text-white/70 text-sm">Ⓒ جميع الحقوق محفوظة {year}</p>

        {/* طرق الدفع — في النهاية تحت */}
        {activePayments.length > 0 && (
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 md:gap-2">
            {activePayments.map((p) => {
              const link = paymentLinksMap[p.name];
              const El: any = link ? "a" : "div";
              const src = getPaymentImagePath(p.name) || p.image || (typeof p.icon === "string" ? p.icon : "");
              const PaymentIcon = getPaymentIcon(p.image || p.icon, p.name);

              return (
                <El
                  key={p.id}
                  {...(link ? { href: link, target: "_blank", rel: "noreferrer" } : {})}
                  title={p.name}
                  className="flex h-8 w-[58px] md:h-9 md:w-[66px] items-center justify-center rounded-lg bg-white px-1.5 py-1 shadow-sm ring-1 ring-black/5 hover:shadow-md transition"
                >
                  {src ? (
                    <img src={src} alt={p.name} className="h-4 md:h-5 w-auto max-w-full object-contain" loading="lazy" />
                  ) : (
                    <PaymentIcon className="text-sm md:text-base text-slate-700" />
                  )}
                </El>
              );
            })}
          </div>
        )}
        </div>

      </div>
    </footer>
  );
}
