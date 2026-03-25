import { createSessionClient, getAccount, getConfig, getDatabase } from '@/lib/server/appwrite';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { UserDocument } from '@/types/user';
import { ID } from 'node-appwrite';
import { createTRPCRouter, protectedProcedure, publicProtectedProcedure } from '../trpc';



export const userRouter = createTRPCRouter({
    getProfile: publicProtectedProcedure
        .query(async ({ ctx }) => {
            try {
                // ctx can be null (no user) or { user: User } (authenticated user)
                if (!ctx || !('user' in ctx) || !ctx.user) {
                    return null;
                }

                const user = ctx.user as {
                    $id: string;
                    email: string;
                    name: string;
                }; // Type assertion for Appwrite User object
                return {
                    id: user.$id,
                    email: user.email,
                    name: user.name,
                };
            } catch (error) {
                console.error('Failed to get user profile:', error);
                throw new Error('Failed to get user profile');
            }
        }),
    getUser: protectedProcedure
        .query(async ({ ctx }) => {
            const database = await getDatabase();
            const config = await getConfig();

            const user = await database.getDocument(config.databaseId, config.userCollectionId, ctx.user.$id);

            return user as UserDocument;
        }),
    updateProfile: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const { name } = input;
                const client = await createSessionClient();
                const account = await getAccount(client);
                await account.updateName(name);

                const database = await getDatabase();
                const config = await getConfig();

                await database.updateDocument(config.databaseId, config.userCollectionId, ctx.user.$id, {
                    name: name,
                });
                return { success: true };
            } catch (error) {
                console.error('Failed to update profile:', error);
                throw new Error('Failed to update profile');
            }
        }),

    bugReport: protectedProcedure
        .input(z.object({
            message: z.string().min(1),
            images: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { message, images } = input;
            const database = await getDatabase();
            const config = await getConfig();

            await database.createDocument(config.databaseId, config.bugReportCollectionId, ID.unique(), {
                message: message,
                email: ctx.user.email,
                images: images
            });
            return { success: true };
        }),
}); 