import { NextResponse } from 'next/server';

export async function POST() {
    // Create a successful response
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    
    // Destroy the Next.js middleware cookie
    response.cookies.delete('my-custom-session');
    
    // Force expire any lingering Appwrite cookies just to be safe
    response.cookies.set('a_session_console', '', { maxAge: 0 });
    response.cookies.set('a_session_project', '', { maxAge: 0 });
    
    return response;
}