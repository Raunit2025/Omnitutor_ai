// src/app/oauth/route.js

import { createAdminClient, createSessionClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { getConfig, getDatabase } from "@/lib/server/appwrite";
import { Query, Account, Client, Databases } from "node-appwrite";
import type { UserDocument } from "@/types/user";

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get("userId");
    const secret = request.nextUrl.searchParams.get("secret");

    if (!userId || !secret) {
        return NextResponse.redirect(request.nextUrl.origin);
    }

    const { account } = await createAdminClient();
    const session = await account.createSession(userId, secret);

    const cookieStore = await cookies();
    cookieStore.set("my-custom-session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 30 * 24 * 60 * 60,
    });

    try {
        // After setting the session cookie, create a session client to get user data
        const sessionClient = await createSessionClient();
        const account = new Account(sessionClient);
        const user = await account.get();
        
        // Use database with admin privileges for document operations
        const database = await getDatabase();
        const config = await getConfig();
        
        // Check if user exists in database
        const userDocuments = await database.listDocuments(config.databaseId, config.userCollectionId, [
            Query.equal('email', user.email)
        ]);

        let redirectPath = '/';

        if (userDocuments.documents.length > 0) {
            const userData = userDocuments.documents[0] as UserDocument;
            
            // If user exists but not onboarded, redirect to onboarding
            if (!userData.onboarded_on) {
                redirectPath = '/onboarding';
            }
        } else {
            // New user - create user record and redirect to onboarding
            await database.createDocument(config.databaseId, config.userCollectionId, userId, {
                email: user.email,
                name: user.name,
                plan: 'free',
                usage: {
                    syllabusNodes: 0,
                    notesNodes: 0,
                    testNodes: 0,
                    chatNodes: 0,
                    audioChatNodes: 0,
                }
            });
            redirectPath = '/onboarding';
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    } catch (error) {
        console.error('Error checking user onboarding status:', error);
        // Fallback to home page if there's an error
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        return NextResponse.redirect(`${baseUrl}/`);
    }
}
