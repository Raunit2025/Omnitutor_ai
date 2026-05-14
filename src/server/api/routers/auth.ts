import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { createAdminClient, createSessionClient, getAccount, getConfig, getDatabase } from '@/lib/server/appwrite';
import { ID, Query } from 'node-appwrite';
import { cookies } from 'next/headers';
import { OAuthProvider } from 'node-appwrite';
import { headers } from 'next/headers';
import type { UserDocument } from '@/types/user';

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
});

const verifyEmailSchema = z.object({
    userId: z.string(),
    otp: z.string(),
});

export const authRouter = createTRPCRouter({
    signUp: publicProcedure
        .input(signUpSchema)
        .mutation(async ({ input }) => {
            try {
                const { account } = await createAdminClient();

                await account.create(
                    ID.unique(),
                    input.email,
                    input.password,
                    input.name
                );

                const session = await account.createEmailPasswordSession(
                    input.email,
                    input.password
                );

                (await cookies()).set('my-custom-session', session.secret, {
                    path: '/',
                    httpOnly: true,
                    sameSite: 'strict',
                    secure: true,
                });

                return { success: true };
            } catch (error: unknown) {
                console.error('Account creation failed:', error);
                throw new Error('Failed to create account');
            }
        }),
    checkEmailExists: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ input }) => {
            try {
                const { account } = await createAdminClient();

                // This approach won't work because account.get() returns the current user
                // We need to check if a user with this email exists in the system
                const users = await account.listIdentities();
                const userExists = users.identities.some(user => user.providerEmail === input.email);

                return userExists;
            } catch (error) {
                console.error('Email check failed:', error);
                throw new Error('Failed to check if email exists');
            }
        }),
    login: publicProcedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
            try {
                const { account } = await createAdminClient();

                const sessionToken = await account.createEmailToken(
                    ID.unique(),
                    input.email
                );

                // (await cookies()).set('my-custom-session', session.secret, {
                //     path: '/',
                //     httpOnly: true,
                //     sameSite: 'strict',
                //     secure: true,
                // });
                const userId = sessionToken.userId;

                return { success: true, userId };
            } catch (error: unknown) {
                console.error('Login failed:', error);
                throw new Error('Invalid credentials');
            }
        }),
    verifyEmail: publicProcedure
        .input(verifyEmailSchema)
        .mutation(async ({ input }) => {
            const { account } = await createAdminClient();
            const session = await account.createSession(
                input.userId,
                input.otp
            );
            (await cookies()).set('my-custom-session', session.secret, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
            });

            try {
                // Check if user needs onboarding
                const user = await account.get();
                const database = await getDatabase();
                const config = await getConfig();
                
                // Check if user exists in database
                const userDocuments = await database.listDocuments(config.databaseId, config.userCollectionId, [
                    Query.equal('email', user.email)
                ]);

                if (userDocuments.documents.length > 0) {
                    const userData = userDocuments.documents[0] as UserDocument;
                    
                    // If user exists and is onboarded, redirect to home
                    if (userData.onboarded_on) {
                        return { success: true, redirect: '/' };
                    } else {
                        return { success: true, redirect: '/onboarding' };
                    }
                } else {
                    // New user - create user record and redirect to onboarding
                    await database.createDocument(config.databaseId, config.userCollectionId, input.userId, {
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
                    return { success: true, redirect: '/onboarding' };
                }
            } catch (error) {
                console.error('Error checking user onboarding status:', error);
                // Fallback to onboarding if there's an error
                return { success: true, redirect: '/onboarding' };
            }
        }),

    getGoogleOAuthUrl: publicProcedure
        .mutation(async () => {
            try {
                const { account } = await createAdminClient();
                const headersList = await headers();
                
                // Safely determine the origin, falling back to host if origin is stripped
                let origin = headersList.get('origin');
                if (!origin) {
                    const host = headersList.get('host');
                    // Automatically use http for localhost and https for Vercel
                    const protocol = host?.includes('localhost') ? 'http' : 'https';
                    origin = `${protocol}://${host}`;
                }

                const redirectUrl = await account.createOAuth2Token(
                    OAuthProvider.Google,
                    `${origin}/oauth`,
                    `${origin}/signup`,
                );

                return { url: redirectUrl };
            } catch (error: unknown) {
                console.error('Google OAuth URL creation failed:', error);
                throw new Error('Failed to create Google OAuth URL');
            }
        }),
}); 