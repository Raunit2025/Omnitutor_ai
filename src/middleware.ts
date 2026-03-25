import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLoggedInUser } from '@/lib/server/appwrite';

export async function middleware(request: NextRequest) {
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
    const protectedPages = ['/account'];

    const pathname = request.nextUrl.pathname;

    // More efficient path matching with early returns
    const isAuthPage = authPages.some(page => pathname === page || pathname.startsWith(`${page}/`));
    const isProtectedPage = protectedPages.some(page => pathname === page || pathname.startsWith(`${page}/`));

    try {
        const user = await getLoggedInUser();

        // If user is not logged in and trying to access protected route
        if (!user && isProtectedPage) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // If user is logged in and trying to access auth pages
        if (user && isAuthPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // If user is logged in and trying to access onboarding page


        return NextResponse.next();
    } catch (error) {
        // Log the error for debugging purposes
        console.error('Middleware authentication error:', error);

        // If there's an error (like no session), redirect to login
        if (isProtectedPage) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }
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