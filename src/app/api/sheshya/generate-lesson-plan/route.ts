import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/shared/sheshya-ai-service";

export async function POST(request: NextRequest) {
    const { class: class_name, chapter, topics, context, subject, duration } = await request.json();

    const notes = await AIService.getInstance().generateLessonPlan({ class: class_name, chapter, topics, subject, context: JSON.stringify(context), duration });

    return NextResponse.json(notes);
}