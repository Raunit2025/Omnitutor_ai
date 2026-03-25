// src/lib/server/appwrite.js
"use server";
import { Client, Account, Databases, Storage } from "node-appwrite";
import { cookies } from "next/headers";

const config = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
    project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "",
    key: process.env.NEXT_APPWRITE_KEY || "",
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
    userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID || "",
    canvasCollectionId: process.env.NEXT_PUBLIC_APPWRITE_CANVAS_COLLECTION_ID || "",
    nodeCollectionId: process.env.NEXT_PUBLIC_APPWRITE_NODE_COLLECTION_ID || "",
    edgeCollectionId: process.env.NEXT_PUBLIC_APPWRITE_EDGE_COLLECTION_ID || "",
    bugReportCollectionId: process.env.NEXT_PUBLIC_APPWRITE_BUG_REPORT_COLLECTION_ID || "",
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "",
    feedbackCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FEEDBACK_COLLECTION_ID || "",
    studyPlanCollectionId: process.env.NEXT_PUBLIC_APPWRITE_STUDY_PLAN_COLLECTION_ID || "",
    newCanvasCollectionId: process.env.NEXT_PUBLIC_APPWRITE_NEW_CANVAS_COLLECTION_ID || "",
};
export async function getConfig() {
    return config;
}
export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.project);

    const session = (await cookies()).get("my-custom-session");
    if (!session || !session.value) {
        throw new Error("No session");
    }

    client.setSession(session.value);
    return client;
}

export async function createAdminClient() {
    const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.project)
        .setKey(config.key);
    return {
        get account() {
            return new Account(client);
        },
    };
}

export async function getDatabase() {
    const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.project)
        .setKey(config.key);
    return new Databases(client);
}

export async function getStorage() {
    const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.project)
        .setKey(config.key);

    return new Storage(client);
}



export async function getLoggedInUser() {
    try {
        const client = await createSessionClient();
        const account = new Account(client);
        try {
            return await account.get();
        } catch (error) {
            console.error("Error fetching user account:", error);
            return null;
        }
    } catch (error) {
        console.error("Session error:", error);
        return null;
    }
}

export async function getAccount(client: Client) {
    return new Account(client);
}

// ... your initilization functions
