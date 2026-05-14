import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createSessionClient, getAccount, getConfig, getDatabase } from '@/lib/server/appwrite';
import type { UserDocument } from '@/types/user';
import { Query } from 'node-appwrite';
import { z } from 'zod';

export const onboardingRouter = createTRPCRouter({
    createUser: protectedProcedure
        .query(async ({ ctx }) => {
            const { email } = ctx.user;
            const database = await getDatabase();
            let userData: UserDocument | null = null;
            const config = await getConfig();

            // Store the default usage object
            const defaultUsage = {
                syllabusNodes: 0,
                notesNodes: 0,
                testNodes: 0,
                chatNodes: 0,
                audioChatNodes: 0,
            };

            try {
                // Check if user already exists
                const userDocuments = await database.listDocuments(config.databaseId, config.userCollectionId, [
                    Query.equal('email', email)
                ]);

                if (userDocuments.documents.length > 0) {
                    userData = userDocuments.documents[0] as UserDocument;

                    // If user exists and is onboarded, return early
                    if (userData.onboarded_on !== null) {
                        if (!userData.usage) {
                            userData = await database.updateDocument(config.databaseId, config.userCollectionId, userData.$id, {
                                usage: JSON.stringify(defaultUsage) // Stringify for Appwrite
                            }) as UserDocument;
                        }

                        // Parse back to object for the frontend
                        if (typeof userData.usage === 'string') {
                            userData.usage = JSON.parse(userData.usage);
                        }
                        return { success: true, redirect: '/', user: userData };
                    }
                } else {
                    // Create new user if not found
                    userData = await database.createDocument(config.databaseId, config.userCollectionId, ctx.user.$id, {
                        email,
                        plan: 'free',
                        usage: JSON.stringify(defaultUsage) // Stringify for Appwrite
                    }) as UserDocument;
                }

                // Ensure user has usage data
                if (!userData.usage) {
                    userData = await database.updateDocument(config.databaseId, config.userCollectionId, userData.$id, {
                        usage: JSON.stringify(defaultUsage) // Stringify for Appwrite
                    }) as UserDocument;
                }

                // Parse back to object for the frontend
                if (typeof userData.usage === 'string') {
                    userData.usage = JSON.parse(userData.usage);
                }

                return { success: true, redirect: '/onboarding', user: userData };
            } catch (error) {
                console.error('Error in createUser procedure:', error);
                throw new Error('Failed to create or retrieve user');
            }
        }),
    updateUserName: protectedProcedure
        .input(z.object({
            name: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { name } = input;
            const client = await createSessionClient();
            const account = await getAccount(client);
            await account.updateName(name);
            const config = await getConfig();

            const database = await getDatabase();
            await database.updateDocument(config.databaseId, config.userCollectionId, ctx.user.$id, {
                name: name,
            });
        }),
    updateCountryName: protectedProcedure
        .input(z.object({
            country_name: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { country_name } = input;
            const { email } = ctx.user;
            const database = await getDatabase();
            const config = await getConfig();
            const user = await database.listDocuments(config.databaseId, config.userCollectionId, [
                Query.equal('email', email)
            ]);
            const userData = user.documents[0] as UserDocument;
            if (userData) {
                await database.updateDocument(config.databaseId, config.userCollectionId, userData.$id, {
                    country_name
                });
            }
        }),
    updateRole: protectedProcedure
        .input(z.object({
            current_role: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { current_role } = input;
            const database = await getDatabase();
            const config = await getConfig();
            await database.updateDocument(config.databaseId, config.userCollectionId, ctx.user.$id, {
                current_role
            });

        }),
    updateCourse: protectedProcedure
        .input(z.object({
            current_course: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { current_course } = input;
            const database = await getDatabase();
            const config = await getConfig();
            await database.updateDocument(config.databaseId, config.userCollectionId, ctx.user.$id, {
                current_course
            });
        }),
    updatePreparingFor: protectedProcedure
        .input(z.object({
            preparing_for: z.array(z.string())
        }))
        .mutation(async ({ ctx, input }) => {
            const { preparing_for } = input;
            const database = await getDatabase();
            const config = await getConfig();
            await database.updateDocument(config.databaseId, config.userCollectionId, ctx.user.$id, {
                preparing_for,
                onboarded_on: new Date()
            });
        }),
});