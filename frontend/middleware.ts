import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/', '/market', '/stock', '/news', '/portfolio', '/admin'];

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const session = request.cookies.get('cs_session')?.value;

    const isProtected = protectedPrefixes.some((prefix) => (
        path === prefix || (prefix !== '/' && path.startsWith(`${prefix}/`))
    ));

    if (isProtected && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (path.startsWith('/admin') && session !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (path === '/login' && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
