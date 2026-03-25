import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/shared/sheshya-ai-service";

export async function POST(request: NextRequest) {
    try {
        const { class: class_name, level, duration, testInfo } = await request.json();

        // Validate required fields
        if (!class_name || !level || !duration || !testInfo) {
            return NextResponse.json(
                { error: "Missing required fields: class, level, duration, and testInfo are required" },
                { status: 400 }
            );
        }

        // Validate testInfo array
        if (!Array.isArray(testInfo) || testInfo.length === 0) {
            return NextResponse.json(
                { error: "testInfo must be a non-empty array" },
                { status: 400 }
            );
        }

        // Validate each test section
        for (let i = 0; i < testInfo.length; i++) {
            const section = testInfo[i];
            const requiredFields = ['subject', 'chapter', 'topics', 'context', 'testType', 'numberOfQuestions', 'marksPerQuestion'];

            for (const field of requiredFields) {
                if (!section[field]) {
                    return NextResponse.json(
                        { error: `Missing required field '${field}' in testInfo section ${i + 1}` },
                        { status: 400 }
                    );
                }
            }

            // Validate testType
            const validTestTypes = ['mcq', 'short', 'long', 'fill_in_the_blank', 'true_false', 'mix'];
            if (!validTestTypes.includes(section.testType)) {
                return NextResponse.json(
                    { error: `Invalid testType '${section.testType}' in section ${i + 1}. Must be one of: ${validTestTypes.join(', ')}` },
                    { status: 400 }
                );
            }

            // Validate numberOfQuestions and marksPerQuestion
            if (typeof section.numberOfQuestions !== 'number' || section.numberOfQuestions <= 0) {
                return NextResponse.json(
                    { error: `numberOfQuestions must be a positive number in section ${i + 1}` },
                    { status: 400 }
                );
            }

            if (typeof section.marksPerQuestion !== 'number' || section.marksPerQuestion <= 0) {
                return NextResponse.json(
                    { error: `marksPerQuestion must be a positive number in section ${i + 1}` },
                    { status: 400 }
                );
            }
        }

        const test = await AIService.getInstance().generateTest({
            class: class_name,
            level,
            duration,
            testInfo
        });

        return NextResponse.json(test);
    } catch (error) {
        console.error('Error generating test:', error);
        return NextResponse.json(
            { error: "Failed to generate test. Please try again." },
            { status: 500 }
        );
    }
}