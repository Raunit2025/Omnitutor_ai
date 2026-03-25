import { getDatabase } from "@/lib/server/appwrite";
import type { UserDocument } from "@/types/user";
import { USAGE_LIMITS } from "@/constants/limits";
import { getConfig } from "@/lib/server/appwrite";
export interface UsageUpdateOptions {
    chatNodes?: number;
    notesNodes?: number;
    testNodes?: number;
    audioChatNodes?: number;
    syllabusNodes?: number;
}

export class UsageService {
    private static instance: UsageService;

    public static getInstance(): UsageService {
        if (!UsageService.instance) {
            UsageService.instance = new UsageService();
        }
        return UsageService.instance;
    }

    async checkUsageLimit(userId: string, usageType: keyof typeof USAGE_LIMITS.free): Promise<boolean> {
        const database = await getDatabase();
        const config = await getConfig();
        const userData = await database.getDocument(
            config.databaseId,
            config.userCollectionId,
            userId
        ) as UserDocument;

        const currentUsage = userData.usage[usageType] || 0;
        const limit = USAGE_LIMITS[userData.plan][usageType];

        return currentUsage < limit;
    }

    async incrementUsage(userId: string, usageType: keyof UsageUpdateOptions, increment: number = 1): Promise<void> {
        const database = await getDatabase();
        const config = await getConfig();
        const userData = await database.getDocument(
            config.databaseId,
            config.userCollectionId,
            userId
        ) as UserDocument;

        const updatedUsage = {
            ...userData.usage,
            [usageType]: (userData.usage[usageType] || 0) + increment,
        };

        await database.updateDocument(
            config.databaseId,
            config.userCollectionId,
            userId,
            {
                usage: updatedUsage,
            }
        );
    }

    async getUserUsage(userId: string): Promise<UserDocument['usage']> {
        const database = await getDatabase();
        const config = await getConfig();
        const userData = await database.getDocument(
            config.databaseId,
            config.userCollectionId,
            userId
        ) as UserDocument;

        return userData.usage;
    }

    async getRemainingUsage(userId: string): Promise<Record<string, number>> {
        const database = await getDatabase();
        const config = await getConfig();
        const userData = await database.getDocument(
            config.databaseId,
            config.userCollectionId,
            userId
        ) as UserDocument;

        const limits = USAGE_LIMITS[userData.plan];
        const usage = userData.usage;

        return {
            chatNodes: Math.max(0, limits.chatNodes - (usage.chatNodes || 0)),
            notesNodes: Math.max(0, limits.notesNodes - (usage.notesNodes || 0)),
            testNodes: Math.max(0, limits.testNodes - (usage.testNodes || 0)),
            audioChatNodes: Math.max(0, limits.audioChatNodes - (usage.audioChatNodes || 0)),
            syllabusNodes: Math.max(0, limits.syllabusNodes - (usage.syllabusNodes || 0)),
        };
    }
} 