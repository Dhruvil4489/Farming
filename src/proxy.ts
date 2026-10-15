import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected path prefixes that require an authenticated session
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/farms',
  '/fields',
  '/crops',
  '/tasks',
  '/scouting',
  '/irrigation',
  '/assistant',
  '/onboarding',
  '/orders',
  '/admin',
  '/mandi',
  '/weather',
  '/soil',
  '/soil-moisture',
  '/store',
  '/guidance',
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Check if current path matches any protected route
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const token = request.cookies.get('smartfarm_token')?.value;

    if (!token) {
      // Redirect unauthenticated visitor to login, preserving intended destination
      const loginUrl = new URL('/login', request.url);
      const destination = pathname + search;
      loginUrl.searchParams.set('redirect', destination);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/...)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .css, .js)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};
