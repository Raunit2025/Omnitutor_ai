import type { Models } from "node-appwrite";
import type { Canvas } from "./canvas";
export type UserDocument = Models.Document & {
    name: string | null;
    email: string;
    country_name: string | null;
    current_role: string | null;
    current_course: string | null;
    current_class: string | null;
    preparing_for: string[];
    is_active: boolean;
    onboarded_on: Date | null;
    plan: 'free' | 'semi_pro' | 'pro';
    usage: {
        syllabusNodes: number;
        notesNodes: number;
        testNodes: number;
        chatNodes: number;
        audioChatNodes: number;
    };
    refreshDate: Date | null;
    canvas: Canvas[];
}