// صفحات الدخول/التسجيل لازم تتبني لكل طلب (مش prerender ثابت)
// عشان المتصفح ميعرضش نسخة قديمة من الـ JS بعد أي تحديث للموقع.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
