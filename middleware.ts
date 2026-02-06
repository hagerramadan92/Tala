import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const proto = request.headers.get('x-forwarded-proto');
  // Force HTTPS in production if the request is over HTTP
  if (isProduction && proto === 'http') {
    // Robust hostname detection for VPS/Proxy environments (like CyberPanel/OpenLiteSpeed)
    // This prevents redirecting to "localhost:3000" if the proxy is internal.
    const host = request.headers.get('host') || request.nextUrl.hostname;
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${host}`);
    
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
