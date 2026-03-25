import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/shared/sheshya-ai-service";


interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { messages: ChatMessage[], context: string };
        const { messages, context } = body;
        const response = await AIService.getInstance().generateChatResponse({ context, messages });
        return NextResponse.json(response);
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}