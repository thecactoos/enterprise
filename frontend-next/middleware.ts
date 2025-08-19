// Next.js Middleware - działa na edge runtime, bardzo szybko
// Obsługuje authentication, redirects, i security

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if user is logged in
const authRoutes = ['/auth/login', '/auth/register'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/api/health'];

// Utility to validate JWT token format
function isValidJWT(token: string | undefined): boolean {
  if (!token || token === 'undefined' || token === 'null') {
    return false;
  }
  // Basic JWT format validation (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (more secure than localStorage in middleware)
  const token = request.cookies.get('crm_token')?.value;
  
  // Check if user is authenticated with valid token
  const isAuthenticated = isValidJWT(token);
  
  // Debug logging (only in development and reduce frequency)
  if (process.env.NODE_ENV === 'development' && 
      (pathname.startsWith('/dashboard') || pathname.startsWith('/auth'))) {
    // Log only occasionally to prevent spam
    if (Math.random() < 0.1) {
      console.log('Middleware check:', { 
        pathname, 
        hasToken: !!token, 
        tokenValid: isValidJWT(token),
        isAuthenticated 
      });
    }
  }
  
  // Handle protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !isAuthenticated) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Redirecting to login - no valid auth token');
    }
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Handle auth routes (redirect to dashboard if already logged in)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isAuthRoute && isAuthenticated) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Redirecting authenticated user away from auth pages');
    }
    // Check for redirect parameter
    const redirect = request.nextUrl.searchParams.get('redirect');
    const redirectUrl = redirect && redirect.startsWith('/') 
      ? new URL(redirect, request.url)
      : new URL('/dashboard', request.url);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  // CSP for better security (adjust based on your needs)
  const isDev = process.env.NODE_ENV === 'development';
  const cspPolicy = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws://localhost:* wss://localhost:* https://cactoos.digital; object-src 'none';"
    : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://cactoos.digital; object-src 'none';";
  
  response.headers.set('Content-Security-Policy', cspPolicy);
  
  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (hot module reload)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|public).*)',
  ],
};