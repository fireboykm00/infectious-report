import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Create a response that we can modify
  let response = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the response cookies, not the request
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Update the response cookies
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Use getUser() instead of getSession() for secure server-side validation
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

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
