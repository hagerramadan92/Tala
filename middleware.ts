import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const proto = request.headers.get('x-forwarded-proto');
  console.log(isProduction, proto);
  // Force HTTPS in production if the request is over HTTP
  // The 'x-forwarded-proto' header is typically set by load balancers/proxies (like Vercel, Cloudflare, Nginx)
  if (isProduction && proto === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    // Using 301 Permanent Redirect
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
