import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Check for Auth Cookie
    const authCookie = request.cookies.get('auth_token');
    const isAuthenticated = authCookie?.value === 'valid';

    // 2. Define Protected Routes
    // Since we want to restrict almost everything except login, 
    // we check if user is visiting restricted pages.
    const path = request.nextUrl.pathname;
    const isProtected = path.startsWith('/market') || path.startsWith('/stock') || path === '/';

    // 3. Redirect Logic
    if (isProtected && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 4. Redirect Authenticated User away from Login
    if (path === '/login' && isAuthenticated) {
        return NextResponse.redirect(new URL('/market', request.url));
    }

    // Redirect Root to Market if authenticated, else login
    if (path === '/' && isAuthenticated) {
        return NextResponse.redirect(new URL('/market', request.url));
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
