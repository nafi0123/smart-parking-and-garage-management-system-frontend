import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken =
    request.cookies.get('accessToken')?.value || request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/verify-otp';
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // If user is already authenticated and visits auth pages, redirect to dashboard
  if (accessToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access protected dashboard routes, redirect to login
  if (!accessToken && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/login', '/register', '/verify-otp'],
};
