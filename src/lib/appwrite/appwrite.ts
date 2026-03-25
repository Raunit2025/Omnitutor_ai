import { Client, Account, Databases } from 'appwrite';
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://db.omnitutor.live/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "6850ef9d00041ee09fb9");

export const account = new Account(client);
export const databases = new Databases(client)

export default client;