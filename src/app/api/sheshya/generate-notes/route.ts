import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/shared/sheshya-ai-service";

export async function POST(request: NextRequest) {
    const { class: class_name, chapter, topics, context, subject } = await request.json();

    const notes = await AIService.getInstance().generateNotes({ class: class_name, chapter, topics, subject, context: JSON.stringify(context) });

    return NextResponse.json(notes);
}