import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Skip middleware for API routes and static files
    if (
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Define page types
    const authPages = ['/login', '/signup'];
    // I added canvas and planner here to ensure they are protected
    const protectedPages = ['/account', '/canvas', '/planner']; 

    const pathname = request.nextUrl.pathname;

    const isAuthPage = authPages.some(page => pathname === page || pathname.startsWith(`${page}/`));
    const isProtectedPage = protectedPages.some(page => pathname === page || pathname.startsWith(`${page}/`));

    try {
        // EDGE RUNTIME FIX: Read the cookie directly instead of using node-appwrite
        const sessionCookie = request.cookies.get('my-custom-session');
        const hasSession = !!sessionCookie?.value;

        // If user is not logged in and trying to access protected route
        if (!hasSession && isProtectedPage) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // If user is logged in and trying to access auth pages
        if (hasSession && isAuthPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware authentication error:', error);
        if (isProtectedPage) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};