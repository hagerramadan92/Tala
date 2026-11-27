"use client";

import Link from "next/link";
import styles from "./Footer.module.css";
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
import {
  Award,
  FileText,
  Headphones,
  Info,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

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

  const companyLinks = [
    { title: "معلومات عنا", href: "/about", icon: Info },
    { title: "الشروط و الأحكام", href: "/terms", icon: FileText },
    { title: "سياسة الإسترجاع", href: "/returnsPolicy", icon: RefreshCw },
  ];

  const importantLinks = [
    { title: "سياسة الخصوصية", href: "/policy", icon: ShieldCheck },
    { title: "الضمان", href: "/warranty", icon: Award },
    { title: "اتصل بنا", href: "/contactUs", icon: Mail },
  ];

  const email = socials.find((s) => s.key === "email")?.value;
  const phone = socials.find((s) => s.key === "phone")?.value;
  const address = socials.find((s) => s.key === "address")?.value;
  const whatsapp = socials.find((s) => s.key === "whatsapp")?.value;

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
    <footer
      dir="rtl"
      className={styles.footer}
    >
      {/* Ambient warm orange corner glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -left-20 h-60 w-72 rounded-full bg-[#eb993d]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-64 rounded-full bg-[#eb993d]/20 blur-3xl"
      />

      <div className={styles.container}>
        {/* TOP SECTION: Brand + Important Links + Company Links */}
        <div className={styles.top}>
          {/* Brand / About + Quick Action Pills */}
          <div className={styles.brand}>
            {/* Logo + Name */}
            <div className={styles.brandLogo}>
              <div className={styles.logo}>
                <Image
                  src="/images/Logo.png"
                  alt="تالا الجزيرة"
                  fill
                  sizes="56px"
                  className="object-contain scale-110"
                />
              </div>
              <span className="h-7 w-[2px] rounded-full bg-[#eb993d]/80" />
              <div className="leading-tight text-right">
                <h3 className={styles.brandName}>
                  تالا الجزيرة
                </h3>
                <p className={styles.brandEnglish}>
                  Tala AlJazeera
                </p>
              </div>
            </div>

            <p className={styles.description}>
              منصة تساعدك تشتري بسهولة، وتتابع طلباتك، وتوصل لمنتجاتك بأفضل تجربة.
            </p>

            {/* Quick action pills: اتصل | بريد | واتساب */}
            <div className={styles.actions}>
              {!isEmptyValue(phone) && (
                <a
                  href={normalizeSocialHref("phone", String(phone))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1f2e] border border-white/15 px-3.5 py-1.5 text-[11px] md:text-xs font-bold text-white hover:border-[#eb993d]/60 hover:bg-[#22283a] transition"
                  aria-label="اتصال بالدعم"
                >
                  <FaPhone className="text-[#eb993d] text-xs" />
                  <span>اتصل</span>
                </a>
              )}

              {!isEmptyValue(email) && (
                <a
                  href={normalizeSocialHref("email", String(email))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1f2e] border border-white/15 px-3.5 py-1.5 text-[11px] md:text-xs font-bold text-white hover:border-[#eb993d]/60 hover:bg-[#22283a] transition"
                  aria-label="إرسال بريد"
                >
                  <FaEnvelope className="text-[#eb993d] text-xs" />
                  <span>بريد</span>
                </a>
              )}

              {!isEmptyValue(whatsapp) && (
                <a
                  href={normalizeSocialHref("whatsapp", String(whatsapp))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1f2e] border border-white/15 px-3.5 py-1.5 text-[11px] md:text-xs font-bold text-white hover:border-emerald-400/60 hover:bg-[#22283a] transition"
                  aria-label="واتساب"
                >
                  <FaWhatsapp className="text-[#25d366] text-sm" />
                  <span>واتساب</span>
                </a>
              )}
            </div>
          </div>

          {/* Links Columns (2 side-by-side cols on mobile & desktop with vertical separator) */}
          <div className={styles.links}>
            {/* روابط مهمة */}
            <div className="border-l border-white/10 pl-4 lg:pl-6">
              <h4 className="text-xs md:text-sm font-extrabold text-white">روابط مهمة</h4>
              <span className="block w-9 h-[2px] rounded-full bg-[#eb993d] mt-1.5 mb-3" />
              <div className="flex flex-col gap-2.5">
                {importantLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-2 text-xs md:text-[13px] text-white/80 hover:text-white transition"
                    >
                      <Icon className="w-3.5 h-3.5 text-white/75 shrink-0" strokeWidth={1.9} />
                      <span>{link.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* الشركة */}
            <div className="pr-4 lg:pr-6">
              <h4 className="text-xs md:text-sm font-extrabold text-white">الشركة</h4>
              <span className="block w-9 h-[2px] rounded-full bg-[#eb993d] mt-1.5 mb-3" />
              <div className="flex flex-col gap-2.5">
                {companyLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-2 text-xs md:text-[13px] text-white/80 hover:text-white transition"
                    >
                      <Icon className="w-3.5 h-3.5 text-white/75 shrink-0" strokeWidth={1.9} />
                      <span>{link.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* HELP / CONTACT BAR ("تريد مساعدة؟") */}
        {(email || phone || address) && (
          <div className={styles.help}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
              <div className="flex items-center justify-start gap-2 shrink-0">
                <Headphones className="w-4 h-4 text-[#eb993d] shrink-0" strokeWidth={2.2} />
                <span className="text-xs md:text-sm font-extrabold text-white whitespace-nowrap">
                  تريد مساعدة؟
                </span>
              </div>

              <span className="hidden lg:block w-px h-6 bg-white/15 shrink-0" />

              <div className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-around gap-2 flex-1">
                {!isEmptyValue(email) && (
                  <a
                    href={normalizeSocialHref("email", String(email))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111521] border border-white/10 px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs text-white/90 hover:border-[#eb993d]/50 transition"
                  >
                    <FaEnvelope className="text-[#eb993d] text-[11px] shrink-0" />
                    <span dir="ltr" className="truncate">{String(email)}</span>
                  </a>
                )}

                {!isEmptyValue(email) && !isEmptyValue(phone) && (
                  <span className="hidden lg:block w-px h-5 bg-white/10 shrink-0" />
                )}

                {!isEmptyValue(phone) && (
                  <a
                    href={normalizeSocialHref("phone", String(phone))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111521] border border-white/10 px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs text-white/90 hover:border-[#eb993d]/50 transition"
                  >
                    <FaPhone className="text-[#eb993d] text-[11px] shrink-0" />
                    <span dir="ltr" className="tabular-nums font-semibold">{String(phone)}</span>
                  </a>
                )}

                {!isEmptyValue(phone) && !isEmptyValue(address) && (
                  <span className="hidden lg:block w-px h-5 bg-white/10 shrink-0" />
                )}

                {!isEmptyValue(address) && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#111521] border border-white/10 px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs text-white/90">
                    <FaMapMarkerAlt className="text-[#eb993d] text-[11px] shrink-0" />
                    <span className="truncate">{String(address)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMMERCIAL REGISTRATION & TAX WHITE PILL */}
        <div className={styles.registration}>
          <div className="inline-flex items-center justify-center gap-4 md:gap-6 rounded-2xl bg-white px-4 md:px-6 py-2.5 shadow-md border-r-4 border-[#eb993d] max-w-full">
            <img
              src="/images/saudi-emblem.png"
              alt="شعار المملكة العربية السعودية"
              className="w-9 h-9 md:w-10 md:h-10 object-contain shrink-0"
              loading="lazy"
            />

            <div className="text-center">
              <p className="text-[10px] md:text-[11px] text-slate-500 font-bold">السجل التجاري</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-900 tabular-nums">
                7002362528
              </p>
            </div>

            <span className="w-px h-7 bg-slate-200 shrink-0" />

            <div className="text-center">
              <p className="text-[10px] md:text-[11px] text-slate-500 font-bold">الرقم الضريبي</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-900 tabular-nums">
                {!isEmptyValue(taxNumber) ? String(taxNumber) : "433334345"}
              </p>
            </div>
          </div>
        </div>

        {/* PAYMENTS & SOCIALS (Mobile: Socials above Payments | Desktop: Payments right, Socials left) */}
        <div className={styles.bottom}>
          {/* Payments (order-2 on mobile, order-1 on desktop -> Right side in RTL) */}
          <div className={styles.payments}>
            <div className="flex items-center justify-center gap-2.5 w-full max-w-sm">
              <span className="h-[1.5px] flex-1 bg-gradient-to-l from-[#eb993d]/80 to-transparent" />
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-[#eb993d]" strokeWidth={2.2} />
                وسائل الدفع الآمنة
              </span>
              <span className="h-[1.5px] flex-1 bg-gradient-to-r from-[#eb993d]/80 to-transparent" />
            </div>

            <div className={styles.paymentLogos}>
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
                    className="flex h-7 w-[50px] md:h-8 md:w-[58px] items-center justify-center rounded-lg bg-white px-1.5 py-1 shadow-sm ring-1 ring-black/5 hover:scale-105 transition"
                  >
                    {src ? (
                      <img src={src} alt={p.name} className="h-3.5 md:h-4 w-auto max-w-full object-contain" loading="lazy" />
                    ) : (
                      <PaymentIcon className="text-xs md:text-sm text-slate-700" />
                    )}
                  </El>
                );
              })}

              {/* بوابة دفع إضافية */}
              <div
                title="بوابة دفع"
                className="flex h-7 w-[50px] md:h-8 md:w-[58px] items-center justify-center rounded-lg bg-white px-1.5 py-1 shadow-sm ring-1 ring-black/5"
              >
                <img
                  src="/images/payments/extra-gateway.png"
                  alt="بوابة دفع"
                  className="h-3.5 md:h-4 w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Socials (order-1 on mobile, order-2 on desktop -> Left side in RTL with vertical divider) */}
          <div className={styles.socials}>
            <div className="flex items-center justify-center gap-2.5 w-full max-w-[220px]">
              <span className="h-[1.5px] flex-1 bg-gradient-to-l from-[#eb993d]/80 to-transparent" />
              <span className="text-xs font-extrabold text-white whitespace-nowrap">تابعنا</span>
              <span className="h-[1.5px] flex-1 bg-gradient-to-r from-[#eb993d]/80 to-transparent" />
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {socialButtons.length === 0 ? (
                <span className="text-white/60 text-xs">لا توجد روابط اجتماعية حالياً</span>
              ) : (
                socialButtons.map((social, idx) => {
                  const socialKey = normalizeSocialKey(social.key);
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
                      className="group inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-white/15 hover:border-[#eb993d]/60 hover:bg-white/15 transition"
                      aria-label={socialKey}
                    >
                      <Icon className="text-white group-hover:scale-110 transition" size={14} />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className={styles.copyright}>
          <p className="text-[11px] md:text-xs text-white/65">
            © جميع الحقوق محفوظة لـ تالا الجزيرة © {year}
          </p>
        </div>
      </div>
    </footer>
  );
}
