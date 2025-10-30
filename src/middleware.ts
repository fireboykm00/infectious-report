import { createServerClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware for authentication and route protection
 * Runs on every request to protected routes
 */
export async function middleware(req: NextRequest) {
  // Create Supabase client for middleware
  const { supabase, response } = createServerClient(req)

  // Use getUser() for secure server-side validation
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Debug logging
  console.log('[Middleware]', {
    path: req.nextUrl.pathname,
    hasUser: !!user,
    userId: user?.id,
  });

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // If accessing a protected path without a user, redirect to auth
  if (isProtectedPath && !user) {
    console.log('[Middleware] Redirecting to /auth - No user');
    const redirectUrl = new URL('/auth', req.url);
    redirectUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth page with an active user, redirect to dashboard
  if (req.nextUrl.pathname === '/auth' && user) {
    console.log('[Middleware] Redirecting to /dashboard - Has user');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Return the response with any updated cookies
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
