import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || '';

  const hostname = host.split(':')[0];

  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  const proto = request.headers.get('x-forwarded-proto');

  // Force HTTPS only on real production domains
  // Never redirect localhost to HTTPS
  if (isProduction && !isLocalhost && proto === 'http') {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${host}`
    );

    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();

  // صفحات HTML متتخزنش: بعد أي تحديث للموقع أسماء ملفات JS بتتغير،
  // ولو المتصفح عرض نسخة HTML قديمة الصفحة بتكسر (زرار مبيشتغلش).
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, max-age=0, must-revalidate'
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
